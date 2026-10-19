import type { IncomingMessage, ServerResponse } from 'node:http';
import { r2Request } from '../_lib/r2';

type VercelRequest = IncomingMessage & { body?: any; method?: string };
type VercelResponse = ServerResponse & { status: (code: number) => VercelResponse; json: (body: unknown) => void };

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.statusCode = 405; res.json({ error: 'Method not allowed' }); return; }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
    const rawData = String(body.file || body.data || '');
    const folder = String(body.folder || 'media').replace(/[^a-zA-Z0-9_-]/g, '');
    let contentType = String(body.contentType || 'image/jpeg');

    if (!rawData) {
      res.statusCode = 400;
      res.json({ error: 'Missing file data (base64 string expected).' });
      return;
    }

    let buffer: Buffer;
    if (rawData.startsWith('data:')) {
      const match = rawData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(rawData, 'base64');
      }
    } else {
      buffer = Buffer.from(rawData, 'base64');
    }

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('mp4') ? 'mp4' : 'jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const r2Key = `uploads/${folder}/${filename}`;

    const r2Res = await r2Request('PUT', r2Key, buffer, contentType);
    if (!r2Res.ok) {
      res.statusCode = 502;
      res.json({ error: `R2 upload failed with HTTP ${r2Res.status}` });
      return;
    }

    const publicUrl = `/api/storage/file?key=${encodeURIComponent(r2Key)}`;
    res.statusCode = 201;
    res.json({
      success: true,
      key: r2Key,
      url: publicUrl,
      size: buffer.length,
      contentType
    });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err instanceof Error ? err.message : 'Upload failed' });
  }
}
