# Gateway Connect — Architecture & Engineering Guide

## 1. System Vision & Purpose
**Gateway Connect** is a mobile-first community web application for Gateway Church. It serves church members, visitors, and ministry leaders for:
- Viewing sermons, announcements, community stories, and testimonies
- Interacting with comments (powered by HTTPS REST with optimistic UI updates)
- 1-on-1 Direct Messaging and Fellowship Group chats (powered by native Supabase Realtime)
- Sunday Service live streaming with real-time "Amen" reactions and live scripture feed
- Zimbabwe Paynow donations (EcoCash, OneMoney, Visa/Mastercard)
- Offline & low-bandwidth resilience for mobile devices on cellular networks

---

## 2. Target Architecture (Serverless Vercel + Supabase)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GATEWAY CONNECT FRONTEND                        │
│                         (Hosted on Vercel CDN)                         │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
      [Standard HTTPS / REST]              [Supabase Realtime WS]
      - Sermons & Announcements            - 1-on-1 Direct Messages
      - Community Posts & Testimonies      - Sunday Live Stream Chat
      - Comments (Optimistic UI)           - Live "Amen" reactions & Presence
      - Paginated Infinite Scroll          (Managed by Supabase, 0 server cost)
                    │                                │
                    ▼                                ▼
       ┌──────────────────────────────────────────────────────────┐
       │                 SUPABASE MANAGED CLOUD                   │
       │           PostgreSQL Database + Auth + Storage           │
       └────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │             VERCEL SERVERLESS FUNCTIONS (/api)           │
       │    Paynow Zimbabwe EcoCash / OneMoney Checkout & Webhook │
       └──────────────────────────────────────────────────────────┘
```

### Why we do NOT use `server.ts`:
- **Vercel is Serverless**: Persistent TCP connections and `ws` WebSocket listeners (`server.ts`) cannot stay alive in Vercel's serverless environment.
- **Supabase Realtime**: Supabase provides managed WebSocket infrastructure out-of-the-box for free, with automatic reconnects and authentication.
- **Paynow Endpoints**: Converted to Vercel Serverless Functions in `/api/paynow/initiate` and `/api/paynow/poll`.

---

## 3. Communication Patterns

### Pattern A: Standard HTTPS + Optimistic UI (Feeds, Posts, Comments)
- Regular video/sermon comments, testimonies, and community posts are read-heavy.
- They are fetched via HTTPS REST queries with pagination (`limit` & `cursor`).
- When posting a comment:
  1. Add optimistic item to local React state immediately with `status: 'pending'`.
  2. Send HTTPS request to Supabase in the background.
  3. If successful, swap the temporary ID with the real DB record.
  4. If failed, roll back state, restore input, and offer a retry action.

### Pattern B: Supabase Realtime WebSockets (DMs, Group Chat, Live Stream)
- Direct messages between members and fellowship group messages use Supabase Realtime table subscriptions (`postgres_changes`).
- Live stream reactions ("Amen", hearts, prayers) use Supabase Broadcast channels (`broadcast: { self: false }`) to avoid hitting disk on high-frequency ephemeral reactions.
- Active members list uses Supabase Presence channels (`presence: { key: user.id }`).

---

## 4. Database Schema & Supabase Setup
The database schema migration is located in:
`supabase/migrations/20260912_init_schema_and_realtime.sql`

Key tables:
- `users` (profiles, handles, avatars, roles)
- `posts` & `post_comments` (church feed, testimonies, comments)
- `messages` & `direct_messages` (group chat & 1-on-1 messaging)
- `group_members` (fellowship groups)
- `sermons` & `live_streams`
- `donations` (Paynow payment logs)
- `prayer_requests`

### Enabling Realtime Publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
```

---

## 5. UI/UX Design System (Removing "Too Much AI" Slop)
- **Design Tone**: Dignified, warm, modern church community (Linear / Framer inspired).
- **Typography**: Clean, readable sans-serif (Inter / Plus Jakarta Sans).
- **Color Palette**:
  - Deep Navy / Slate background (`#0B1120` / `#0F172A`) or Clean Modern Light (`#F8FAFC`).
  - Warm Gold / Amber primary accent (`#D97706` / `#F59E0B`) representing faith and community.
  - Muted slate borders (`#1E293B` or `#E2E8F0`), eliminating random neon gradients.
- **Border Radius**: Crisp, consistent 6px–8px (`rounded-lg`). Avoid bloated, pill-shaped bubble cards.
- **Interactions**: Micro-animations using GPU-accelerated properties (`transform`, `opacity`).
