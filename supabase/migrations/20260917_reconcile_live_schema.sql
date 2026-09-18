-- ==============================================================================
-- Gateway Connect — LIVE SCHEMA RECONCILIATION + REALTIME / GRANT HARDENING
--
-- Run AFTER 20260912_init_schema_and_realtime.sql in the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> paste -> Run). Idempotent: safe to re-run.
--
-- This fixes the production bugs that stopped cross-device sync:
--   * users.id was UUID, but the app uses TEXT ids (usr_apostle_joe, usr_17...).
--     Every `users` upsert therefore failed with 22P02 -> newly registered
--     members NEVER reached the shared database, so new and old users could
--     not see each other.  <-- THE main "new users not connecting" bug.
--   * users / prayer_requests / etc. were missing columns the app writes
--     (location, city_location, followers_count, following_count,
--     offline_sermon_ids, is_anonymous, is_public, ...) -> writes rejected.
--   * live_streamers had no UNIQUE(user_id) for the app's upsert.
--   * no `receipts` table.
--   * anon/authenticated had no GRANTs, realtime publication was incomplete,
--     and REPLICA IDENTITY was missing.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. USERS — TEXT id + every column the app writes
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(150) DEFAULT 'Church Member',
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS cell_group VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS member_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS baptism_date DATE,
    ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT 'Harare, Zimbabwe',
    ADD COLUMN IF NOT EXISTS city_location VARCHAR(150) DEFAULT 'Harare',
    ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS saved_verses TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS offline_sermon_ids TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS badge_type VARCHAR(50) DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- -----------------------------------------------------------------------------
-- 2. PRAYER REQUESTS — add columns the app reads/writes
-- -----------------------------------------------------------------------------
ALTER TABLE public.prayer_requests
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS author_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS title VARCHAR(150),
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS request_text TEXT,
    ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_answered BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS answered_testimony TEXT,
    ADD COLUMN IF NOT EXISTS prayer_count INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS apostle_prayed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS apostle_notes TEXT,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- -----------------------------------------------------------------------------
-- 3. DONATIONS / BOOKINGS / SERMONS / DEVOTIONALS / EVENTS / PRODUCTS / ORDERS
--    (add any columns missing on older installs)
-- -----------------------------------------------------------------------------
ALTER TABLE public.donations
    ADD COLUMN IF NOT EXISTS donor_id TEXT,
    ADD COLUMN IF NOT EXISTS donor_name VARCHAR(150) DEFAULT 'Anonymous Covenant Partner',
    ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS fund_type VARCHAR(100) DEFAULT 'Tithe',
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'EcoCash',
    ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'Paynow Zimbabwe',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS impact_tag VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.service_bookings
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS session_title VARCHAR(150),
    ADD COLUMN IF NOT EXISTS minister_name VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS user_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS user_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS preferred_date VARCHAR(50),
    ADD COLUMN IF NOT EXISTS preferred_time VARCHAR(50),
    ADD COLUMN IF NOT EXISTS booking_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS time_slot VARCHAR(50),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'confirmed',
    ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 30.00,
    ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS zoom_link TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.sermons
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS speaker VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    ADD COLUMN IF NOT EXISTS series VARCHAR(150),
    ADD COLUMN IF NOT EXISTS duration VARCHAR(50),
    ADD COLUMN IF NOT EXISTS youtube_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS audio_url TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS scriptures TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.devotionals
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS scripture_reference VARCHAR(150),
    ADD COLUMN IF NOT EXISTS scripture_verse TEXT,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS prayer TEXT,
    ADD COLUMN IF NOT EXISTS declaration TEXT,
    ADD COLUMN IF NOT EXISTS audio_duration VARCHAR(50),
    ADD COLUMN IF NOT EXISTS author VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    ADD COLUMN IF NOT EXISTS publish_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS event_date VARCHAR(100),
    ADD COLUMN IF NOT EXISTS event_time VARCHAR(100),
    ADD COLUMN IF NOT EXISTS location VARCHAR(255),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS rsvp_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Crusade',
    ADD COLUMN IF NOT EXISTS speaker VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10, 2) DEFAULT 10,
    ADD COLUMN IF NOT EXISTS price_zig NUMERIC(10, 2) DEFAULT 150,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS user_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS total_usd NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'EcoCash',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS delivery_address TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- -----------------------------------------------------------------------------
-- 4. LIVE STREAMERS — unique key used by the app's upsert
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'live_streamers_user_id_key'
    ) THEN
        ALTER TABLE public.live_streamers ADD CONSTRAINT live_streamers_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. RECEIPTS (Paynow) — referenced by SupabaseSyncService.syncReceipt
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    date TEXT,
    payer_name VARCHAR(150),
    payer_phone VARCHAR(50),
    payer_email VARCHAR(150),
    amount NUMERIC(12, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    purpose VARCHAR(150),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'completed',
    items_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. GRANTS for the client roles (RLS policies still apply on top)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. PERMISSIVE CLIENT POLICIES (re-asserted for every app table)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'user_follows', 'follows', 'sermons', 'posts', 'post_comments',
        'community_stories', 'church_settings', 'live_streams', 'devotionals',
        'donations', 'prayer_requests', 'service_bookings', 'events', 'products',
        'orders', 'direct_messages', 'messages', 'user_activities', 'live_streamers',
        'carts', 'cart_items', 'profile_pictures', 'message_reactions',
        'group_members', 'group_media', 'notification_settings', 'receipts'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public access %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 8. REALTIME PUBLICATION — every table the client subscribes to
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'messages', 'direct_messages', 'posts', 'post_comments',
        'live_streams', 'prayer_requests', 'message_reactions', 'users',
        'group_members', 'profile_pictures', 'live_streamers',
        'community_stories', 'church_settings'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        END IF;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 9. REPLICA IDENTITY FULL (complete UPDATE/DELETE payloads)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'messages', 'direct_messages', 'posts', 'post_comments',
        'live_streams', 'prayer_requests', 'message_reactions', 'users',
        'group_members', 'profile_pictures', 'live_streamers',
        'community_stories', 'church_settings'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', tbl);
    END LOOP;
END $$;

-- Done. New user registrations, posts, comments, prayers, DMs and group chat
-- will now write to and read from the shared database on every device.
