<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Gateway Connect

Gateway Connect is a Vite React app. The live WebSocket hub is optional: the app loads and works with local storage even when the hub is offline.

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. For real-time cross-user updates, start the hub in a second terminal:

   ```bash
   npm run live-server
   ```

## Download or publish the source

Create a clean ZIP from the project folder:

```bash
npm run package:source
```

The ZIP excludes `.env`, `node_modules`, `dist`, and `.git`, but includes `.env.example`. Never upload `.env` because it contains private credentials. To publish the source to GitHub:

```bash
git init
git add .
git commit -m "Initial Gateway Connect source"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

## WebSocket compatibility

The frontend can connect to any WebSocket URL through `VITE_LIVE_WS_URL`, provided that server implements the Gateway Connect JSON message contract. The URL can be `ws://`, `wss://`, `http://`, or `https://`; HTTP URLs are converted to WebSocket URLs automatically.

Client to server messages:

```json
{"type":"hello","user":{"id":"user-123","full_name":"Example User","handle":"@example"}}
{"type":"sync_state","payload":{"testimonies":[],"prayers":[],"directMessages":[],"fellowshipPosts":[]}}
{"type":"event","payload":{"type":"direct_message","payload":{"id":"message-123"}}}
```

Server to client messages are `live_state`, `presence`, `event`, or `error`. An arbitrary third-party WebSocket cannot be used without a small adapter because WebSocket transport alone does not define the application message format.

The included hub keeps its relay state in memory and broadcasts instantly. For real production durability, keep Supabase or another database as the source of truth and use the WebSocket server as the real-time notification layer. Restarting the included hub clears its in-memory snapshot.

## Hosting

Build the frontend with `npm run build` and host the generated `dist` folder on Vercel, Netlify, Cloudflare Pages, or another static host. The WebSocket hub must run on a service that supports long-lived WebSocket connections, such as Render, Railway, Fly.io, or a VPS.

For production, set this frontend environment variable before building:

```text
VITE_LIVE_WS_URL=wss://live.yourdomain.com/live
```

Vercel is suitable for the frontend, but do not run the WebSocket hub as a normal Vercel serverless function. The app now skips live connection attempts entirely when this variable is not configured, so it will not hang or repeatedly retry in production.

## Custom domain

Yes, you can use your own domain. Add it in the hosting provider's Domains settings, then add the DNS records the provider gives you at your domain registrar. A typical setup is:

- App: `https://yourdomain.com`
- Live hub: `wss://live.yourdomain.com/live`

Set `VITE_LIVE_WS_URL` to the live hub address and redeploy the frontend.
