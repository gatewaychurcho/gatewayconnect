import { createServer } from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

type LiveEvent = {
  type: 'testimony' | 'comment' | 'like' | 'direct_message' | 'fellowship_post' | 'prayer' | 'follow' | 'notification' | 'story' | 'group' | 'reaction' | 'stream' | 'pulpit';
  payload: unknown;
};

type LiveState = {
  testimonies: unknown[];
  prayers: unknown[];
  directMessages: unknown[];
  fellowshipPosts: unknown[];
  activeMembers: Array<{ id: string; full_name: string; handle?: string }>;
};

const clients = new Map<WebSocket, { id: string; full_name: string; handle?: string }>();
const state: LiveState = { testimonies: [], prayers: [], directMessages: [], fellowshipPosts: [], activeMembers: [] };
const knownEventTypes = new Set<LiveEvent['type']>([
  'testimony', 'comment', 'like', 'direct_message', 'fellowship_post', 'prayer',
  'follow', 'notification', 'story', 'group', 'reaction', 'stream', 'pulpit'
]);

const broadcast = (message: unknown, except?: WebSocket) => {
  const encoded = JSON.stringify(message);
  clients.forEach((_member, client) => {
    if (client !== except && client.readyState === WebSocket.OPEN) client.send(encoded);
  });
};

const sendPresence = () => {
  state.activeMembers = Array.from(clients.values());
  broadcast({ type: 'presence', payload: state.activeMembers });
};

const readJson = (request: import('node:http').IncomingMessage): Promise<Record<string, unknown>> => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 64 * 1024) reject(new Error('Request body too large.'));
  });
  request.on('end', () => {
    try { resolve(JSON.parse(body || '{}') as Record<string, unknown>); }
    catch { reject(new Error('Invalid JSON body.')); }
  });
  request.on('error', reject);
});

const sendJson = (response: import('node:http').ServerResponse, status: number, payload: unknown) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
};

const paynowHash = (values: string[], key: string) => crypto.createHash('sha512').update(values.join('') + key, 'utf8').digest('hex').toUpperCase();

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/health') {
    sendJson(response, 200, { service: 'gateway-connect-live', connected: clients.size });
    return;
  }

  if (requestUrl.pathname === '/api/paynow/initiate' && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const integrationId = String(process.env.PAYNOW_INTEGRATION_ID || '').trim();
      const integrationKey = String(process.env.PAYNOW_INTEGRATION_KEY || '').trim();
      if (!integrationId || !integrationKey || integrationId === '12345') {
        sendJson(response, 503, { success: false, error: 'Live Paynow credentials are not configured on the server.' });
        return;
      }
      const reference = String(body.reference || '').trim();
      const amount = Number(body.amount || 0).toFixed(2);
      const additionalInfo = String(body.additionalInfo || 'Gateway Church Ministry').trim();
      const returnUrl = String(body.returnUrl || process.env.PAYNOW_RETURN_URL || '').trim();
      const resultUrl = String(body.resultUrl || process.env.PAYNOW_RESULT_URL || '').trim();
      const authEmail = String(body.authEmail || process.env.PAYNOW_MERCHANT_EMAIL || '').trim();
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
        hash: paynowHash(values, integrationKey)
      });
      const phone = String(body.phone || '').trim();
      const method = String(body.method || '').toLowerCase();
      if (phone && (method === 'ecocash' || method === 'onemoney')) {
        params.set('phone', phone);
        params.set('method', method);
      }
      const endpoint = phone && (method === 'ecocash' || method === 'onemoney')
        ? 'https://www.paynow.co.zw/interface/remotetransaction'
        : 'https://www.paynow.co.zw/interface/initiatetransaction';
      const paynowResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      const raw = await paynowResponse.text();
      const result = new URLSearchParams(raw);
      const ok = result.get('status')?.toLowerCase() === 'ok';
      sendJson(response, 200, ok
        ? { success: true, reference, browserUrl: result.get('browserurl') || undefined, pollUrl: result.get('pollurl') || undefined, instructions: result.get('instructions') || 'Payment request sent to Paynow.' }
        : { success: false, reference, error: result.get('error') || 'Paynow rejected the transaction.' });
    } catch (error) {
      sendJson(response, 502, { success: false, error: error instanceof Error ? error.message : 'Paynow gateway unavailable.' });
    }
    return;
  }

  if (requestUrl.pathname === '/api/paynow/poll' && request.method === 'GET') {
    const pollUrl = requestUrl.searchParams.get('url');
    if (!pollUrl || !pollUrl.startsWith('https://www.paynow.co.zw/')) {
      sendJson(response, 400, { success: false, error: 'Invalid Paynow poll URL.' });
      return;
    }
    try {
      const pollResponse = await fetch(pollUrl);
      const params = new URLSearchParams(await pollResponse.text());
      const status = params.get('status') || 'Created';
      sendJson(response, 200, {
        status,
        reference: params.get('reference') || '',
        amount: Number(params.get('amount') || 0),
        paynowReference: params.get('paynowreference') || undefined,
        isPaid: status.toLowerCase() === 'paid'
      });
    } catch (error) {
      sendJson(response, 502, { status: 'Sent', reference: '', amount: 0, isPaid: false, error: error instanceof Error ? error.message : 'Paynow unavailable.' });
    }
    return;
  }

  if (requestUrl.pathname === '/' || requestUrl.pathname === '/health') {
    sendJson(response, 200, { service: 'gateway-connect-live', connected: clients.size });
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});
const socketServer = new WebSocketServer({ server, path: '/live' });

socketServer.on('connection', (socket) => {
  socket.on('message', (raw) => {
    try {
      if (raw.toString().length > 256 * 1024) {
        socket.send(JSON.stringify({ type: 'error', payload: 'Live event is too large.' }));
        return;
      }
      const message = JSON.parse(raw.toString()) as {
        type: 'hello' | 'sync_state' | 'event';
        user?: { id: string; full_name: string; handle?: string };
        payload?: LiveState | LiveEvent;
      };

      if (message.type === 'hello' && message.user) {
        clients.set(socket, message.user);
        socket.send(JSON.stringify({ type: 'live_state', payload: state }));
        sendPresence();
        return;
      }

      if (message.type === 'sync_state' && message.payload) {
        const incoming = message.payload as LiveState;
        if (state.testimonies.length === 0) state.testimonies = incoming.testimonies || [];
        if (state.prayers.length === 0) state.prayers = incoming.prayers || [];
        if (state.directMessages.length === 0) state.directMessages = incoming.directMessages || [];
        if (state.fellowshipPosts.length === 0) state.fellowshipPosts = incoming.fellowshipPosts || [];
        return;
      }

      if (message.type === 'event' && message.payload) {
        const event = message.payload as LiveEvent;
        if (!knownEventTypes.has(event.type)) {
          socket.send(JSON.stringify({ type: 'error', payload: 'Unsupported live event type.' }));
          return;
        }
        const collection = event.type === 'direct_message'
          ? state.directMessages
          : event.type === 'fellowship_post'
            ? state.fellowshipPosts
            : event.type === 'prayer'
              ? state.prayers
              : ['testimony', 'comment', 'like'].includes(event.type)
                ? state.testimonies
                : null;
        const entity = event.payload as { id?: string };
        if (collection && entity?.id && !collection.some(item => (item as { id?: string }).id === entity.id)) {
          collection.push(event.payload);
        }
        broadcast({ type: 'event', payload: event }, socket);
      }
    } catch {
      socket.send(JSON.stringify({ type: 'error', payload: 'Invalid live event.' }));
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
    sendPresence();
  });
});

const port = Number(process.env.PORT || process.env.LIVE_PORT || 8787);

server.listen(port, '0.0.0.0', () => {
  console.log('Gateway Connect live hub listening on port ' + port);
});