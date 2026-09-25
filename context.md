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
- [x] Optimistic Comment Pipeline integrated: Connected optimistic updates to `CommunityTab.tsx` and `FloatingCommentReply.tsx` with zero-latency feedback, `.comment-pending` pulsing badges, `.comment-synced` confirmations, and graceful rollback.
- [x] Paynow Zimbabwe Serverless Integration: Enhanced `api/paynow/initiate.ts` and `src/services/paynowService.ts` with direct serverless routing, secret preservation, and fallback handling for EcoCash and OneMoney.
- [x] Build and TypeScript verification (`tsc --noEmit` passed with 0 errors).
- [x] Storage Buckets & RLS Policies Hardening (`supabase/migrations/20260921_storage_buckets_setup.sql` & `src/services/StorageBucketService.ts`): Resolved SQLSTATE 42501 (`must be owner of table objects`) by omitting redundant `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` (Supabase already manages and enables RLS on `storage.objects` under `supabase_storage_admin`), created idempotent bucket definitions for `media` and `avatars`, and enhanced client storage service with dual-bucket routing and fallback.
- [x] Account Deletion, Auto-Follow Protected Leaders & Cooked HomeTab Redesign: Implemented complete user account deletion with modal confirmation and data purge; auto-follow for Developer and Super Admins on signup/login with permanent unfollow protection; zero-baseline stats and posts for newly registered believers; redesigned `HomeTab.tsx` with top video player intact, daily devotional with TTS speech declaration, small trending & live testimony agreement with confetti praise counter, church quick actions hub, and connected whole-app experience.
- [x] Group Management & Clean UTF-8 Emoji Standardization: Resolved missing React hook imports (`useEffect`) in `GroupInfoModal.tsx` for real-time group updating, eliminated all corrupted mojibake character sequences in `DirectMessagesModal.tsx` and `storageService.ts` to ensure crisp rendering of reaction emojis (🙏, ❤️, 🔥, ✝️, 🕊️, etc.), and verified full compilation passing `tsc --noEmit` and Vite production build.
- [x] Admin Media Library & Auth Avatar Integration: Added Official Avatars and Post Thumbnails management in Admin Panel, wired custom avatar selection to member signup and profile settings, resolved missing React imports (`useRef`) and icon definitions (`ImageIcon`, `Upload`, `Check`) in `AdminPanel.tsx` and `LoginScreen.tsx`, and added `saveMedia` fallback in `localMediaStore.ts`, achieving 100% clean TypeScript linting (`tsc --noEmit`) and Vite production compilation.
- [x] Real-time Community Feed Post Deletion & Signup Forgot Password: Implemented multi-layered real-time deletion listener in `CommunityTab.tsx` and `StorageService` using Supabase Realtime broadcast channels, Postgres CDC delete replication, native cross-tab BroadcastChannel, and storage events so posts disappear immediately without page refresh across all connected clients; added Forgot Password recovery options to the Sign Up form in `LoginScreen.tsx` and `App.tsx` auth modal.
- [x] Auth Redesign & Mandatory Multi-Step Onboarding Wizard: Redesigned the sign-in/sign-up screen with a modern Framer obsidian aesthetic, two-column responsive desktop layout, full mobile responsiveness ($\ge 44\text{px}$ touch targets), strictly supporting email/phone and password; overhauled the 'Forgot Password' flow into a clear 3-step state machine with real-time OTP verification; created Facebook-style multi-step onboarding wizard (`OnboardingWizard.tsx`) that mandates selecting or uploading a profile avatar before unlocking the main dashboard, personalized fellowship setup, leadership connection spotlight, and official Gateway Believer Digital Pass.
- [x] Unified Auth Modal, Believer Digital Pass Modal & Onboarding Management: Replaced duplicate legacy auth form in `App.tsx` with the unified obsidian `LoginScreen`, adding smooth modal presentation with dismiss capability and initial view routing; created standalone `BelieverPassModal.tsx` with Apostle Joe Daniels seal, member ID copy, active status badge, assembly city, verified badge, and WhatsApp sharing; wired 'Pass' quick action button into `MeTab.tsx` profile header and Settings panel; enabled believers to re-run fellowship and spiritual onboarding at any time from Settings or their digital pass.

