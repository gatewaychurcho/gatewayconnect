import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';

type VercelRequest = IncomingMessage & { query?: Record<string, string>; url?: string };
type VercelResponse = ServerResponse & { status: (code: number) => VercelResponse; json: (body: unknown) => void };

const AGORA_APP_ID = process.env.VITE_AGORA_APP_ID || 'fd0f715b597a4263a736f5ac20473f73';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'c948a6d9956c4837ac9c33eb63b30e0e';

function generateRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: string | number,
  role: number = 1,
  expireTimeSeconds: number = 86400
): string {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeSeconds;

  // Build token payload
  const version = '006';
  const salt = Math.floor(Math.random() * 99999999) + 1;
  const uidStr = String(uid);

  const message = `${appId}${channelName}${uidStr}${salt}${privilegeExpiredTs}${role}`;
  const signature = crypto.createHmac('sha256', appCertificate).update(message).digest('hex');

  // Packed token string: version + appId + signature + salt + privilegeExpiredTs
  const content = `${version}${appId}${signature}${salt}${privilegeExpiredTs}`;
  const token = Buffer.from(content).toString('base64');
  return `006${token}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  const urlObj = new URL(req.url || '/', 'http://localhost');
  const channel = urlObj.searchParams.get('channel') || 'gateway-live';
  const uid = urlObj.searchParams.get('uid') || '0';
  const role = urlObj.searchParams.get('role') === 'publisher' ? 1 : 2;

  try {
    const token = generateRtcToken(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channel,
      uid,
      role
    );

    res.statusCode = 200;
    res.json({
      success: true,
      appId: AGORA_APP_ID,
      channel,
      uid,
      role: role === 1 ? 'publisher' : 'subscriber',
      token,
      expiresIn: 86400
    });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err instanceof Error ? err.message : 'Token generation failed' });
  }
}
