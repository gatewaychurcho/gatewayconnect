import type { IncomingMessage, ServerResponse } from 'node:http';
import { r2Request } from '../_lib/r2';

type VercelRequest = IncomingMessage & { query?: Record<string, string>; url?: string };
type VercelResponse = ServerResponse & { status: (code: number) => VercelResponse; send: (body: Buffer | string) => void };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  const urlObj = new URL(req.url || '/', 'http://localhost');
  const key = urlObj.searchParams.get('key');

  if (!key) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Query parameter key is required.' }));
    return;
  }

  try {
    const r2Res = await r2Request('GET', key);
    if (!r2Res.ok) {
      res.statusCode = r2Res.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'File not found in storage.' }));
      return;
    }

    const contentType = r2Res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await r2Res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(buffer);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Error fetching file.' }));
  }
}
