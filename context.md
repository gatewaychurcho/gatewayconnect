# Context: Gateway Connect

## Project Summary
- **App Name**: Gateway Connect
- **Client/Purpose**: Community web application for Gateway Church (Sermons, Testimonies, DMs, Fellowship groups, Sunday Live stream, Paynow Zimbabwe donations).
- **Hosting Environment**: Vercel (Frontend CDN + Serverless Functions) + Supabase (Managed Postgres, Auth, Realtime).
- **Core Problem Solved**: Eliminating broken Node `ws` server (`server.ts`) which cannot run on Vercel; replacing with native Supabase Realtime for DMs/Live Stream, and HTTPS + Optimistic Updates for comments/posts as specified in `gemini.txt`.

## Key Technical Decisions
1. **Zero Custom Server on Vercel**: No `server.ts` or port 8787. Paynow logic moved to `/api/paynow/*` serverless functions.
2. **Hybrid Communication**:
   - Posts / Comments &rarr; HTTPS REST + Optimistic UI updates (prevents battery drain & network loss).
   - DMs / Group Chat / Live Stream reactions &rarr; Native Supabase Realtime Channels.
3. **Database Schema**: Full PostgreSQL migration extracted into `supabase/migrations/` with `supabase_realtime` publication enabled.
4. **UI Refactor**: Replacing generic AI template feel with a polished Framer-style aesthetic (Inter/Jakarta Sans, crisp 6-8px borders, subtle warm amber accents, no tacky gradients).

## Milestones & Status
- [x] Architecture & Guide defined (`GUIDE.md`, `context.md`)
- [x] Complete Supabase SQL migration generated (`supabase/migrations/20260912_init_schema_and_realtime.sql`)
- [x] Vercel Serverless Paynow endpoints (`api/paynow/initiate.ts`, `api/paynow/poll.ts`)
- [x] Upgraded Supabase Realtime Client Service with Broadcast and Presence (`src/services/liveSyncService.ts`, `src/lib/realtime.ts`)
- [x] Optimistic Updates hook for comments (`src/hooks/useOptimisticComments.ts`)
- [x] Modernized UI aesthetic: eliminated dated 90s navy and harsh yellow; adopted Framer Obsidian Slate (`#090D16`), champagne gold (`#E5C07B`), hairline subtle borders (`border-white/[0.08]`), glassmorphism dock, and restrained typography.
- [x] Dark & Light mode theme switcher: instant toggle via top header Sun/Moon button and Me tab Settings panel; persistent theme state in localStorage (`gcz_theme_v1`), dynamic `[data-theme]` CSS variables with smooth transitions.
- [x] Centralized environment configuration outside `src/` in root [`config.ts`](file:///c:/Users/aliar/Documents/GitHub/gatewayconnect/config.ts): single source of truth for all `import.meta.env` and `process.env` values across frontend and backend.
- [x] Shadcn UI & Framer Design Overhaul (`agential-skill`): Created Shadcn primitives (`Button`, `Card`, `Badge`, `Tabs`, `cn` utility in `src/components/ui/`), overhauled `index.css`, `Header.tsx`, `Navigation.tsx`, and `HomeTab.tsx` with anti-pill minimal roundness (6-8px), eliminated hardcoded navy/yellow clashing colors, unified dynamic theme tokens for seamless Dark & Light mode transitions.
- [x] Build and TypeScript verification (`tsc --noEmit` passed with 0 errors).
