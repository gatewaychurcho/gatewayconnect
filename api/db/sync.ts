import type { IncomingMessage, ServerResponse } from 'node:http';
import { getR2Json, putR2Json } from '../_lib/r2';

type VercelRequest = IncomingMessage & { body?: any; query?: Record<string, string>; method?: string; url?: string };
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

const ALLOWED_COLLECTIONS = new Set(['posts', 'users', 'settings', 'donations', 'gallery', 'prayers', 'orders']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  const urlObj = new URL(req.url || '/', 'http://localhost');
  const collectionParam = (urlObj.searchParams.get('collection') || 'posts').toLowerCase();

  if (!ALLOWED_COLLECTIONS.has(collectionParam)) {
    res.statusCode = 400;
    res.json({ error: `Unknown collection '${collectionParam}'. Allowed: ${Array.from(ALLOWED_COLLECTIONS).join(', ')}` });
    return;
  }

  const r2Key = `db/${collectionParam}.json`;

  if (req.method === 'GET') {
    const data = await getR2Json(r2Key, []);
    res.statusCode = 200;
    res.json({ success: true, collection: collectionParam, data });
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
      const action = (body.action || 'save') as string;
      const payload = body.data;

      let currentData = await getR2Json<any[]>(r2Key, []);
      if (!Array.isArray(currentData)) currentData = [];

      if (action === 'save') {
        // Replace entire collection
        const nextData = Array.isArray(payload) ? payload : [payload];
        await putR2Json(r2Key, nextData);
        res.statusCode = 200;
        res.json({ success: true, action: 'save', count: nextData.length });
        return;
      }

      if (action === 'append' || action === 'upsert') {
        const item = payload as any;
        if (!item || !item.id) {
          res.statusCode = 400;
          res.json({ error: 'Item id is required for append/upsert' });
          return;
        }
        const existingIdx = currentData.findIndex(i => i.id === item.id);
        if (existingIdx >= 0) {
          currentData[existingIdx] = { ...currentData[existingIdx], ...item };
        } else {
          currentData.unshift(item);
        }
        await putR2Json(r2Key, currentData);
        res.statusCode = 200;
        res.json({ success: true, action, item });
        return;
      }

      if (action === 'delete') {
        const targetId = body.id || (payload && (payload as any).id);
        if (!targetId) {
          res.statusCode = 400;
          res.json({ error: 'Item id is required for delete' });
          return;
        }
        const filtered = currentData.filter(i => i.id !== targetId);
        await putR2Json(r2Key, filtered);
        res.statusCode = 200;
        res.json({ success: true, action: 'delete', deletedId: targetId });
        return;
      }

      res.statusCode = 400;
      res.json({ error: `Unsupported action '${action}'` });
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: err instanceof Error ? err.message : 'Failed to sync data to database' });
    }
    return;
  }

  res.statusCode = 405;
  res.json({ error: 'Method not allowed' });
}
