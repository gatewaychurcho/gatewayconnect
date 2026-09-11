import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { CONFIG } from '../../config';

type VercelRequest = IncomingMessage & {
  body?: any;
  query?: Record<string, string | string[]>;
  method?: string;
};

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
  send: (body: any) => void;
};

const paynowHash = (values: string[], key: string) =>
  crypto.createHash('sha512').update(values.join('') + key, 'utf8').digest('hex').toUpperCase();

const readBody = (req: IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 64 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
    const integrationId = CONFIG.PAYNOW_INTEGRATION_ID;
    const integrationKey = CONFIG.PAYNOW_INTEGRATION_KEY;

    if (!integrationId || !integrationKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: 'Paynow credentials (PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY) are not configured on the server.',
        })
      );
      return;
    }

    const reference = String(body.reference || '').trim();
    const amount = Number(body.amount || 0).toFixed(2);
    const additionalInfo = String(body.additionalInfo || 'Gateway Church Ministry').trim();
    const returnUrl = String(body.returnUrl || CONFIG.PAYNOW_RETURN_URL || '').trim();
    const resultUrl = String(body.resultUrl || CONFIG.PAYNOW_RESULT_URL || '').trim();
    const authEmail = String(body.authEmail || CONFIG.PAYNOW_MERCHANT_EMAIL || '').trim();
    const status = 'Message';
    const values = [integrationId, reference, amount, additionalInfo, returnUrl, resultUrl, authEmail, status];

    const params = new URLSearchParams({
      id: integrationId,
      reference,
      amount,
      additionalinfo: additionalInfo,
      returnurl: returnUrl,
      resulturl: resultUrl,
      authemail: authEmail,
      status,
      hash: paynowHash(values, integrationKey),
    });

    const phone = String(body.phone || '').trim();
    const method = String(body.method || '').toLowerCase();
    if (phone && (method === 'ecocash' || method === 'onemoney')) {
      params.set('phone', phone);
      params.set('method', method);
    }

    const endpoint =
      phone && (method === 'ecocash' || method === 'onemoney')
        ? 'https://www.paynow.co.zw/interface/remotetransaction'
        : 'https://www.paynow.co.zw/interface/initiatetransaction';

    const paynowResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const raw = await paynowResponse.text();
    const result = new URLSearchParams(raw);
    const ok = result.get('status')?.toLowerCase() === 'ok';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify(
        ok
          ? {
              success: true,
              reference,
              browserUrl: result.get('browserurl') || undefined,
              pollUrl: result.get('pollurl') || undefined,
              instructions: result.get('instructions') || 'Payment request sent to Paynow.',
            }
          : {
              success: false,
              reference,
              error: result.get('error') || 'Paynow rejected the transaction.',
            }
      )
    );
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Paynow gateway unavailable.',
      })
    );
  }
}
