import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

type VercelRequest = IncomingMessage & { body?: any; method?: string };
type VercelResponse = ServerResponse & { status: (code: number) => VercelResponse; json: (body: unknown) => void };

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk.toString();
      if (raw.length > 64 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.statusCode = 405; res.json({ error: 'Method not allowed' }); return; }

  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) { res.statusCode = 401; res.json({ error: 'Authentication required.' }); return; }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
    const serviceType = String(body.serviceType || '').trim();
    const preferredDate = String(body.preferredDate || '').trim();
    const preferredTime = String(body.preferredTime || '').trim();
    if (!serviceType || !preferredDate || !preferredTime) { res.statusCode = 400; res.json({ error: 'serviceType, preferredDate, and preferredTime are required.' }); return; }

    const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, { global: { headers: { Authorization: authorization } } });
    const user = await supabase.auth.getUser(authorization.slice(7));
    if (user.error || !user.data.user) { res.statusCode = 401; res.json({ error: 'Invalid authentication session.' }); return; }
    const result = await supabase.from('service_bookings').insert({
      user_id: user.data.user.id,
      service_type: serviceType,
      session_title: serviceType,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      time_slot: preferredTime,
      notes: String(body.notes || '').trim(),
      status: 'pending',
      deposit_paid: false
    }).select('id, status').single();
    if (result.error) { res.statusCode = 502; res.json({ error: result.error.message }); return; }
    res.statusCode = 201;
    res.json(result.data);
  } catch (error) {
    res.statusCode = 500;
    res.json({ error: error instanceof Error ? error.message : 'Unable to create booking.' });
  }
}
