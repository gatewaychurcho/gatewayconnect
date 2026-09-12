import { createServer } from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { CONFIG } from './config';

type LiveEvent = {
  type: 'testimony' | 'comment' | 'like' | 'direct_message' | 'fellowship_post' | 'prayer' | 'follow' | 'notification' | 'story' | 'group' | 'reaction' | 'stream' | 'pulpit' | 'stream_chat' | 'stream_reaction' | 'user_created' | 'user_banned' | 'unban_user';
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
  'follow', 'notification', 'story', 'group', 'reaction', 'stream', 'pulpit',
  'stream_chat', 'stream_reaction', 'user_created', 'user_banned', 'unban_user'
]);

const broadcast = (message: unknown, except?: WebSocket) => {
  const encoded = JSON.stringify(message);
  console.log("Broadcasting:", encoded);
  clients.forEach((_member, client) => {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      client.send(encoded);
    }
  });
};

const sendPresence = () => {
  state.activeMembers = Array.from(clients.values());
  console.log("Presence update:", state.activeMembers);
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

  // ... your Paynow routes unchanged ...

  if (requestUrl.pathname === '/' || requestUrl.pathname === '/health') {
    sendJson(response, 200, { service: 'gateway-connect-live', connected: clients.size });
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

const socketServer = new WebSocketServer({ server, path: '/live' });

socketServer.on('connection', (socket) => {
  console.log("Client connected at", new Date().toISOString());

  socket.on('message', (raw) => {
    console.log("Raw message:", raw.toString());
    try {
      const message = JSON.parse(raw.toString());
      console.log("Parsed message:", message);

      if (message.type === 'hello' && message.user) {
        clients.set(socket, message.user);
        console.log("Hello from user:", message.user);
        socket.send(JSON.stringify({ type: 'live_state', payload: state }));
        sendPresence();
        return;
      }

      if (message.type === 'sync_state' && message.payload) {
        console.log("Sync state received");
        const incoming = message.payload as LiveState;
        if (state.testimonies.length === 0) state.testimonies = incoming.testimonies || [];
        if (state.prayers.length === 0) state.prayers = incoming.prayers || [];
        if (state.directMessages.length === 0) state.directMessages = incoming.directMessages || [];
        if (state.fellowshipPosts.length === 0) state.fellowshipPosts = incoming.fellowshipPosts || [];
        return;
      }

      if (message.type === 'event' && message.payload) {
        const event = message.payload as LiveEvent;
        console.log("Event received:", event);
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
    } catch (err) {
      console.error("Error parsing message:", err);
      socket.send(JSON.stringify({ type: 'error', payload: 'Invalid live event.' }));
    }
  });

  socket.on('close', () => {
    console.log("Client disconnected at", new Date().toISOString());
    clients.delete(socket);
    sendPresence();
  });
});

const port = CONFIG.PORT;

server.listen(port, '0.0.0.0', () => {
  console.log('Gateway Connect live hub listening on port ' + port);
});
