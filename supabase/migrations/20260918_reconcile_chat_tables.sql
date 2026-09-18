-- ==============================================================================
-- Gateway Connect — Chat / Media table reconciliation (run #3)
--
-- The chat tables pre-existed with a legacy shape that does not match the app:
--   * messages.id was UUID (app writes TEXT ids like 'dm_…' / 'msg_…')
--   * messages lacked group_id / sender_* / media_* / read_* / deleted_* columns
--   * direct_messages used `content` while the app writes `message`
--   * group_members lacked `role`; id was UUID
--   * profile_pictures used `url`/`uploaded_at`; app writes `avatar_url`/`updated_at`
--   * direct_messages FKs to users blocked DMs to ids not yet in `users`
--
-- Run AFTER 20260912 / 20260917. Idempotent.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. messages
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.messages ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.messages ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS group_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS receiver_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150) DEFAULT 'Church Member',
    ADD COLUMN IF NOT EXISTS sender_avatar TEXT,
    ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS reply_to JSONB,
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read_by_user_ids TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_for_users TEXT[] DEFAULT '{}';

-- -----------------------------------------------------------------------------
-- 2. direct_messages
-- -----------------------------------------------------------------------------
ALTER TABLE public.direct_messages
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Legacy FK constraints block messages to ids that are not in `users` yet,
-- which also suppressed the realtime INSERT event. Drop them.
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey;
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_receiver_id_fkey;

-- -----------------------------------------------------------------------------
-- 3. group_members
-- -----------------------------------------------------------------------------
ALTER TABLE public.group_members ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.group_members ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.group_members ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.group_members
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_group_id_user_id_key') THEN
        ALTER TABLE public.group_members ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. profile_pictures
-- -----------------------------------------------------------------------------
ALTER TABLE public.profile_pictures
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_pictures_user_id_key') THEN
        ALTER TABLE public.profile_pictures ADD CONSTRAINT profile_pictures_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4b. Drop legacy NOT NULL constraints on columns the app no longer writes
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.direct_messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.profile_pictures ALTER COLUMN url DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Re-assert grants + realtime for the reconciled tables
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY['messages', 'direct_messages', 'group_members', 'profile_pictures'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        END IF;
        EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', tbl);
    END LOOP;
END $$;
