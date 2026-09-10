import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

type LiveEvent = {
  type: 'testimony' | 'comment' | 'like' | 'direct_message' | 'fellowship_post' | 'prayer' | 'follow' | 'notification' | 'story' | 'group' | 'reaction' | 'stream';
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
  'follow', 'notification', 'story', 'group', 'reaction', 'stream'
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

const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ service: 'gateway-connect-live', connected: clients.size }));
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