import type { IncomingMessage, ServerResponse } from 'node:http';

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[]>;
  method?: string;
};

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
  send: (body: any) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pollUrl = reqUrl.searchParams.get('url');

  if (!pollUrl || !pollUrl.startsWith('https://www.paynow.co.zw/')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Invalid Paynow poll URL.' }));
    return;
  }

  try {
    const pollResponse = await fetch(pollUrl);
    const params = new URLSearchParams(await pollResponse.text());
    const status = params.get('status') || 'Created';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status,
        reference: params.get('reference') || '',
        amount: Number(params.get('amount') || 0),
        paynowReference: params.get('paynowreference') || undefined,
        isPaid: status.toLowerCase() === 'paid',
      })
    );
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'Sent',
        reference: '',
        amount: 0,
        isPaid: false,
        error: error instanceof Error ? error.message : 'Paynow unavailable.',
      })
    );
  }
}
