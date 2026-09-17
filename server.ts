import { createServer } from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { CONFIG } from './config';

type LiveEvent = {
  type: 'testimony' | 'comment' | 'like' | 'direct_message' | 'fellowship_post' | 'prayer' | 'follow' | 'notification' | 'story' | 'group' | 'reaction' | 'stream' | 'pulpit' | 'stream_chat' | 'stream_reaction' | 'user_created' | 'user_banned' | 'unban_user' | 'stream_viewer_joined' | 'stream_viewer_left';
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
  'stream_chat', 'stream_reaction', 'user_created', 'user_banned', 'unban_user',
  'stream_viewer_joined', 'stream_viewer_left'
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

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const serveStaticFile = (filePath: string, response: import('node:http').ServerResponse): boolean => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    response.end(content);
    return true;
  } catch {
    return false;
  }
};

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/health') {
    sendJson(response, 200, { service: 'gateway-connect-live', connected: clients.size });
    return;
  }

  if (requestUrl.pathname === '/api/facebook/resolve') {
    let targetUrl = requestUrl.searchParams.get('url');

    if (request.method === 'POST') {
      try {
        const body = await readJson(request);
        if (typeof body.url === 'string') targetUrl = body.url;
      } catch {}
    }

    if (!targetUrl) {
      sendJson(response, 400, { success: false, error: 'Missing url parameter' });
      return;
    }

    try {
      targetUrl = targetUrl.trim();
      const userAgent = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
      const fbResp = await fetch(targetUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow'
      });

      const resolvedUrl = fbResp.url || targetUrl;
      const html = await fbResp.text();

      const idMatch = resolvedUrl.match(/\/(?:videos|reel)\/(?:[^\/]+\/)?(\d{8,25})/) ||
                      resolvedUrl.match(/[?&]v=(\d{8,25})/) ||
                      html.match(/\/(?:videos|reel)\/(?:[^\/]+\/)?(\d{8,25})/) ||
                      html.match(/"video_id":"(\d{8,25})"/);

      const numericVideoId = idMatch ? idMatch[1] : undefined;

      const titleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']*)["']/i) ||
                         html.match(/<title>([^<]*)<\/title>/i);
      let title = titleMatch ? titleMatch[1] : undefined;
      if (title) {
        title = title
          .replace(/&amp;/g, '&')
          .replace(/&#xb7;/g, '·')
          .replace(/&quot;/g, '"')
          .replace(/^\d+(\.\d+)?[KM]?\s+views\s+·\s+\d+\s+reactions\s+\|\s+/i, '')
          .trim();
      }

      const descMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']*)["']/i);
      let description = descMatch ? descMatch[1] : undefined;
      if (description) {
        description = description.replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
      }

      const imgMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']*)["']/i);
      const thumbnailUrl = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : undefined;

      const canonicalUrl = numericVideoId
        ? `https://www.facebook.com/watch/?v=${numericVideoId}`
        : resolvedUrl;
      
      const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalUrl)}&show_text=0&width=500`;

      sendJson(response, 200, {
        success: true,
        originalUrl: targetUrl,
        resolvedUrl,
        canonicalUrl,
        embedUrl,
        numericVideoId,
        title: title || 'Apostolic Broadcast with Apostle Joe Daniels',
        description: description || 'Gateway Church Zimbabwe Live Altar',
        thumbnailUrl,
        author: 'Apostle Joe Daniels'
      });
      return;
    } catch (err: any) {
      sendJson(response, 200, {
        success: false,
        originalUrl: targetUrl,
        resolvedUrl: targetUrl,
        canonicalUrl: targetUrl,
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(targetUrl)}&show_text=0&width=500`,
        error: err.message
      });
      return;
    }
  }

  // ... your Paynow routes unchanged ...

  if (requestUrl.pathname === '/health') {
    sendJson(response, 200, { status: 'ok', service: 'gateway-connect-live', connected: clients.size });
    return;
  }

  // Serve static assets from dist/ directory with SPA fallback
  const distDir = [
    path.join(process.cwd(), 'dist'),
    path.resolve(__dirname, '..', 'dist'),
    path.resolve(__dirname)
  ].find(dir => fs.existsSync(path.join(dir, 'index.html'))) || path.join(process.cwd(), 'dist');

  const cleanPath = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, ''));
  const targetFilePath = path.join(distDir, cleanPath);

  // Security: prevent path traversal outside distDir
  if (targetFilePath.startsWith(distDir) && fs.existsSync(targetFilePath) && fs.statSync(targetFilePath).isFile()) {
    if (serveStaticFile(targetFilePath, response)) return;
  }

  // SPA fallback to index.html for all page routes
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    if (serveStaticFile(indexPath, response)) return;
  }

  // Fallback if dist has not been generated
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gateway Connect</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#09090b;color:#f4f4f5;text-align:center;padding:1rem;"><div><h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;">Gateway Connect</h1><p style="font-size:0.875rem;color:#a1a1aa;">Serving live apostolic fellowship. Refreshing view...</p></div><script>setTimeout(() => location.reload(), 2000);</script></body></html>`);
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

const port = Number(process.env.PORT || CONFIG.PORT || 3000);

server.listen(port, '0.0.0.0', () => {
  console.log('Gateway Connect server listening on 0.0.0.0:' + port);
});
