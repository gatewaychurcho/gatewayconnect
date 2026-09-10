export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- GATEWAY CONNECT - SUPABASE PRODUCTION DATABASE SCHEMA (IDEMPOTENT / SAFE)
-- Ministry: Gateway Church Zimbabwe (Founder: Apostle Joe Daniels)
-- Features: Auth & Profiles, Live Streams & Audio Lite, Church Settings,
--           Community Feed & Testimonies, Comments, Stories, Follows,
--           EcoCash/Paynow/Stripe Giving, 1-on-1 Zoom Bookings, Prayer Wall
-- Note: Safe to re-run multiple times without duplicate errors
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SAFE PAYMENT GATEWAY ENUM HANDLING (If user has custom enum type)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateway') THEN
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'EcoCash Push';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'OneMoney';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'Telecash';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'InnBucks';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'ZIPIT';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'Paynow';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'Credit Card';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'PayPal';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'Moors';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'Cash';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;

    -- Safe donation_fund enum update (support 'Altar Seed')
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_fund') THEN
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Altar Seed';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Tithe';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Firstfruits';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Seed Faith';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Building Foundation';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Missions & Evangelism';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Apostolic Honorarium';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 3. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    referral_code VARCHAR(50),
    avatar_url TEXT,
    cell_group VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    member_id VARCHAR(50),
    baptism_date DATE,
    location VARCHAR(150) DEFAULT 'Harare, Zimbabwe',
    city_location VARCHAR(150) DEFAULT 'Harare',
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    saved_verses TEXT[] DEFAULT '{}',
    offline_sermon_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure users columns exist (Handles existing tables that were created with fewer columns)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150) DEFAULT 'Church Member';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cell_group VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS member_id VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS baptism_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT 'Harare, Zimbabwe';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city_location VARCHAR(150) DEFAULT 'Harare';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS saved_verses TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS offline_sermon_ids TEXT[] DEFAULT '{}';

-- Ensure id column has default UUID generator even if previously created without DEFAULT
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END;
END $$;

-- 4. USER FOLLOWS TABLE (Real-time Follow / Unfollow System)
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id VARCHAR(100) NOT NULL,
    following_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 5. SERMONS TABLE (Video & Audio Broadcast Archive)
CREATE TABLE IF NOT EXISTS public.sermons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    speaker VARCHAR(150) NOT NULL DEFAULT 'Apostle Joe Daniels',
    series VARCHAR(150),
    duration VARCHAR(50),
    youtube_id VARCHAR(100) NOT NULL,
    audio_url TEXT,
    thumbnail_url TEXT,
    scriptures TEXT[] DEFAULT '{}',
    description TEXT,
    notes TEXT,
    view_count INT DEFAULT 0,
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. POSTS & TESTIMONIES TABLE (Community Feed, Apostolic Word, Videos & Notes)
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT,
    author_name VARCHAR(150),
    author_handle VARCHAR(100),
    avatar_url TEXT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100) DEFAULT 'Apostolic Word',
    image_url TEXT,
    video_url TEXT,
    youtube_id VARCHAR(100),
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    verified_by_church BOOLEAN DEFAULT TRUE,
    speaker VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    series VARCHAR(150),
    duration VARCHAR(50),
    audio_url TEXT,
    thumbnail_url TEXT,
    scriptures TEXT[] DEFAULT '{}',
    description TEXT,
    notes TEXT,
    view_count INT DEFAULT 0,
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure posts columns exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_name VARCHAR(150);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_handle VARCHAR(100);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Apostolic Word';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS youtube_id VARCHAR(100);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS verified_by_church BOOLEAN DEFAULT TRUE;

-- 7. POST COMMENTS TABLE (Interactive Testimony Discussion)
CREATE TABLE IF NOT EXISTS public.post_comments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    post_id TEXT,
    user_id TEXT NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_handle VARCHAR(100),
    user_avatar TEXT,
    text TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    badge_type VARCHAR(50) DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure post_comments columns exist
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS user_handle VARCHAR(100);
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS badge_type VARCHAR(50) DEFAULT 'none';

-- 8. COMMUNITY STORIES TABLE (24-Hour Church & Believer Stories)
CREATE TABLE IF NOT EXISTS public.community_stories (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_handle VARCHAR(100),
    avatar_url TEXT,
    badge_type VARCHAR(50) DEFAULT 'none',
    image_url TEXT,
    caption TEXT,
    text TEXT,
    scripture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure community_stories columns exist
ALTER TABLE public.community_stories ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.community_stories ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.community_stories ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.community_stories ADD COLUMN IF NOT EXISTS scripture TEXT;
ALTER TABLE public.community_stories ADD COLUMN IF NOT EXISTS badge_type VARCHAR(50) DEFAULT 'none';

-- 9. CHURCH SETTINGS TABLE (Global Sanctuary Stream URL, Apostolic Config)
CREATE TABLE IF NOT EXISTS public.church_settings (
    id VARCHAR(100) PRIMARY KEY,
    current_stream_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LIVE STREAMS TABLE (Multi-Platform Broadcast Controller)
CREATE TABLE IF NOT EXISTS public.live_streams (
    id VARCHAR(100) PRIMARY KEY,
    current_stream_url TEXT,
    title TEXT,
    viewer_count INT DEFAULT 0,
    is_live BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DEVOTIONALS TABLE (Seeds of Destiny / Apostolic Daily Word)
CREATE TABLE IF NOT EXISTS public.devotionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    scripture_reference VARCHAR(150) NOT NULL,
    scripture_verse TEXT NOT NULL,
    content TEXT NOT NULL,
    prayer TEXT NOT NULL,
    declaration TEXT NOT NULL,
    audio_duration VARCHAR(50),
    author VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    publish_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DONATIONS TABLE (Stores EcoCash Push, OneMoney, Paynow, Stripe Giving)
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id TEXT,
    donor_name VARCHAR(150) DEFAULT 'Anonymous Covenant Partner',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    fund_type VARCHAR(100) NOT NULL DEFAULT 'Tithe',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'EcoCash',
    payment_gateway VARCHAR(50) DEFAULT 'EcoCash Push',
    status VARCHAR(50) DEFAULT 'completed',
    receipt_number VARCHAR(100),
    impact_tag VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS donor_name VARCHAR(150) DEFAULT 'Anonymous Covenant Partner';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS fund_type VARCHAR(100) DEFAULT 'Tithe';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'EcoCash';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'EcoCash Push';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS impact_tag VARCHAR(255);
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Ensure donation_fund enum includes 'Altar Seed' & drop check constraints if present
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_fund') THEN
        BEGIN
            ALTER TYPE donation_fund ADD VALUE IF NOT EXISTS 'Altar Seed';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_fund_type_check;

-- 13. PRAYER REQUESTS TABLE (Altar of Grace & Prayer Wall)
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    author_name VARCHAR(150),
    user_name VARCHAR(150),
    title VARCHAR(150),
    is_anonymous BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    request_text TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    answered_testimony TEXT,
    prayer_count INT DEFAULT 1,
    apostle_prayed BOOLEAN DEFAULT FALSE,
    apostle_notes TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in prayer_requests
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS author_name VARCHAR(150);
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS user_name VARCHAR(150);
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS title VARCHAR(150);
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS apostle_prayed BOOLEAN DEFAULT FALSE;

-- 14. SERVICE BOOKINGS TABLE (1-on-1 Pastoral Consultation & Zoom Appointments)
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    session_title VARCHAR(150),
    minister_name VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    user_name VARCHAR(150),
    user_phone VARCHAR(50),
    user_email VARCHAR(150),
    service_type VARCHAR(100),
    preferred_date VARCHAR(50),
    preferred_time VARCHAR(50),
    booking_date DATE DEFAULT CURRENT_DATE,
    time_slot VARCHAR(50),
    status VARCHAR(50) DEFAULT 'confirmed',
    deposit_amount NUMERIC(10, 2) DEFAULT 30.00,
    deposit_paid BOOLEAN DEFAULT TRUE,
    zoom_link TEXT,
    notes TEXT,
    reminder_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in service_bookings
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS session_title VARCHAR(150);
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS minister_name VARCHAR(150) DEFAULT 'Apostle Joe Daniels';
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS preferred_date VARCHAR(50);
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS preferred_time VARCHAR(50);

-- 15. EVENTS TABLE (Crusades, Conferences, Miracle Services)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    event_date VARCHAR(100) NOT NULL,
    event_time VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    banner_url TEXT,
    rsvp_count INT DEFAULT 0,
    category VARCHAR(100) DEFAULT 'Crusade',
    speaker VARCHAR(150) DEFAULT 'Apostle Joe Daniels',
    is_featured BOOLEAN DEFAULT FALSE,
    ticket_required BOOLEAN DEFAULT FALSE,
    ticket_price_usd NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PRODUCTS TABLE (Apostolic Books, Anointing Oil, Media)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL DEFAULT 10,
    price_zig NUMERIC(10, 2) NOT NULL DEFAULT 150,
    price_zar NUMERIC(10, 2) DEFAULT 699,
    image_url TEXT,
    description TEXT,
    color_theme VARCHAR(100),
    fabric TEXT,
    available_sizes TEXT[],
    features TEXT[],
    author_or_brand VARCHAR(150) DEFAULT 'Gateway Church Zimbabwe',
    in_stock BOOLEAN DEFAULT TRUE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_zar NUMERIC(10, 2) DEFAULT 699;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_theme VARCHAR(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fabric TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_sizes TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[];

-- 17. ORDERS TABLE (Resource Orders with Delivery)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    user_name VARCHAR(150) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'EcoCash',
    status VARCHAR(50) DEFAULT 'Pending',
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. DIRECT MESSAGES TABLE (Real-Time Member DMs)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id VARCHAR(100) NOT NULL,
    receiver_id VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. USER ACTIVITIES TABLE (Logs likes, reactions, and streams)
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. LIVE STREAMERS & AUDIENCE METRICS
CREATE TABLE IF NOT EXISTS public.live_streamers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Harare',
    device VARCHAR(50) DEFAULT 'Mobile',
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. CARTS TABLE (Kingdom Store E-Commerce Persistence)
CREATE TABLE IF NOT EXISTS public.carts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. CART ITEMS TABLE (Synchronized Cart Items with Product Details)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    cart_id TEXT,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1,
    category VARCHAR(100),
    image_url TEXT,
    selected_size VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. FOLLOWS TABLE (Direct Follows Table in addition to user_follows)
CREATE TABLE IF NOT EXISTS public.follows (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    follower_id VARCHAR(100) NOT NULL,
    following_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);

-- 24. PROFILE PICTURES TABLE (Persistent Custom User Avatars)
CREATE TABLE IF NOT EXISTS public.profile_pictures (
    user_id TEXT PRIMARY KEY,
    avatar_url TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. MESSAGE REACTIONS TABLE (WhatsApp-style Reactions on DMs and Groups)
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    message_id TEXT NOT NULL,
    chat_type VARCHAR(50) DEFAULT 'group',
    user_id TEXT NOT NULL,
    user_name VARCHAR(150),
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (message_id, user_id, emoji)
);

-- 26. GROUP MEMBERS TABLE (Isolated User-Specific Group Memberships)
CREATE TABLE IF NOT EXISTS public.group_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

-- 27. GROUP MEDIA TABLE (Shared Images, Videos, & Documents in Group Info)
CREATE TABLE IF NOT EXISTS public.group_media (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    group_id TEXT NOT NULL,
    message_id TEXT,
    user_id TEXT NOT NULL,
    user_name VARCHAR(150),
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image',
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. NOTIFICATION SETTINGS TABLE (Live Streams, Prayer Requests, Direct Messages)
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id TEXT PRIMARY KEY,
    live_streams BOOLEAN DEFAULT TRUE,
    prayer_requests BOOLEAN DEFAULT TRUE,
    direct_messages BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 28. ENABLE ROW LEVEL SECURITY (RLS) SAFELY
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_pictures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 29. IDEMPOTENT RLS POLICIES (DROP FIRST, THEN CREATE - PREVENTS ERROR 42710)
-- ==============================================================================

-- Users Policies
DROP POLICY IF EXISTS "Public read users" ON public.users;
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert users" ON public.users;
CREATE POLICY "Public insert users" ON public.users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update users" ON public.users;
CREATE POLICY "Public update users" ON public.users FOR UPDATE USING (true);

-- User Follows Policies
DROP POLICY IF EXISTS "Public read user_follows" ON public.user_follows;
CREATE POLICY "Public read user_follows" ON public.user_follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert user_follows" ON public.user_follows;
CREATE POLICY "Public insert user_follows" ON public.user_follows FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete user_follows" ON public.user_follows;
CREATE POLICY "Public delete user_follows" ON public.user_follows FOR DELETE USING (true);

-- Sermons Policies
DROP POLICY IF EXISTS "Public read sermons" ON public.sermons;
CREATE POLICY "Public read sermons" ON public.sermons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert sermons" ON public.sermons;
CREATE POLICY "Public insert sermons" ON public.sermons FOR INSERT WITH CHECK (true);

-- Posts & Testimonies Policies
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert posts" ON public.posts;
CREATE POLICY "Public insert posts" ON public.posts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update posts" ON public.posts;
CREATE POLICY "Public update posts" ON public.posts FOR UPDATE USING (true);

-- Post Comments Policies
DROP POLICY IF EXISTS "Public read post_comments" ON public.post_comments;
CREATE POLICY "Public read post_comments" ON public.post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert post_comments" ON public.post_comments;
CREATE POLICY "Public insert post_comments" ON public.post_comments FOR INSERT WITH CHECK (true);

-- Community Stories Policies
DROP POLICY IF EXISTS "Public read community_stories" ON public.community_stories;
CREATE POLICY "Public read community_stories" ON public.community_stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert community_stories" ON public.community_stories;
CREATE POLICY "Public insert community_stories" ON public.community_stories FOR INSERT WITH CHECK (true);

-- Church Settings Policies
DROP POLICY IF EXISTS "Public read church_settings" ON public.church_settings;
CREATE POLICY "Public read church_settings" ON public.church_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert church_settings" ON public.church_settings;
CREATE POLICY "Public insert church_settings" ON public.church_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update church_settings" ON public.church_settings;
CREATE POLICY "Public update church_settings" ON public.church_settings FOR UPDATE USING (true);

-- Live Streams Policies
DROP POLICY IF EXISTS "Public read live_streams" ON public.live_streams;
CREATE POLICY "Public read live_streams" ON public.live_streams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert live_streams" ON public.live_streams;
CREATE POLICY "Public insert live_streams" ON public.live_streams FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update live_streams" ON public.live_streams;
CREATE POLICY "Public update live_streams" ON public.live_streams FOR UPDATE USING (true);

-- Devotionals Policies
DROP POLICY IF EXISTS "Public read devotionals" ON public.devotionals;
CREATE POLICY "Public read devotionals" ON public.devotionals FOR SELECT USING (true);

-- Donations Policies
DROP POLICY IF EXISTS "Public read donations" ON public.donations;
CREATE POLICY "Public read donations" ON public.donations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert donations" ON public.donations;
CREATE POLICY "Public insert donations" ON public.donations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "SuperAdmin full access donations" ON public.donations;
CREATE POLICY "SuperAdmin full access donations" ON public.donations FOR ALL USING (true);

-- Prayer Requests Policies
DROP POLICY IF EXISTS "Public read prayer requests" ON public.prayer_requests;
CREATE POLICY "Public read prayer requests" ON public.prayer_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert prayer requests" ON public.prayer_requests;
CREATE POLICY "Public insert prayer requests" ON public.prayer_requests FOR INSERT WITH CHECK (true);

-- Service Bookings Policies
DROP POLICY IF EXISTS "Public read service bookings" ON public.service_bookings;
CREATE POLICY "Public read service bookings" ON public.service_bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert service bookings" ON public.service_bookings;
CREATE POLICY "Public insert service bookings" ON public.service_bookings FOR INSERT WITH CHECK (true);

-- Events Policies
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);

-- Products & Orders Policies
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Notification Settings Policies
DROP POLICY IF EXISTS "Public read notification_settings" ON public.notification_settings;
CREATE POLICY "Public read notification_settings" ON public.notification_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public upsert notification_settings" ON public.notification_settings;
CREATE POLICY "Public upsert notification_settings" ON public.notification_settings FOR ALL USING (true);

-- Direct Messages Policies
DROP POLICY IF EXISTS "Public read direct_messages" ON public.direct_messages;
CREATE POLICY "Public read direct_messages" ON public.direct_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert direct_messages" ON public.direct_messages;
CREATE POLICY "Public insert direct_messages" ON public.direct_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update direct_messages" ON public.direct_messages;
CREATE POLICY "Public update direct_messages" ON public.direct_messages FOR UPDATE USING (true);

-- Activities & Live Streamers Policies
DROP POLICY IF EXISTS "Public read user_activities" ON public.user_activities;
CREATE POLICY "Public read user_activities" ON public.user_activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert user_activities" ON public.user_activities;
CREATE POLICY "Public insert user_activities" ON public.user_activities FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read live_streamers" ON public.live_streamers;
CREATE POLICY "Public read live_streamers" ON public.live_streamers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert live_streamers" ON public.live_streamers;
CREATE POLICY "Public insert live_streamers" ON public.live_streamers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update live_streamers" ON public.live_streamers;
CREATE POLICY "Public update live_streamers" ON public.live_streamers FOR UPDATE USING (true);

-- Follows Policies
DROP POLICY IF EXISTS "Public read follows" ON public.follows;
CREATE POLICY "Public read follows" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert follows" ON public.follows;
CREATE POLICY "Public insert follows" ON public.follows FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete follows" ON public.follows;
CREATE POLICY "Public delete follows" ON public.follows FOR DELETE USING (true);

-- Carts Policies
DROP POLICY IF EXISTS "Public read carts" ON public.carts;
CREATE POLICY "Public read carts" ON public.carts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert carts" ON public.carts;
CREATE POLICY "Public insert carts" ON public.carts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update carts" ON public.carts;
CREATE POLICY "Public update carts" ON public.carts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete carts" ON public.carts;
CREATE POLICY "Public delete carts" ON public.carts FOR DELETE USING (true);

-- Cart Items Policies
DROP POLICY IF EXISTS "Public read cart_items" ON public.cart_items;
CREATE POLICY "Public read cart_items" ON public.cart_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert cart_items" ON public.cart_items;
CREATE POLICY "Public insert cart_items" ON public.cart_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update cart_items" ON public.cart_items;
CREATE POLICY "Public update cart_items" ON public.cart_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete cart_items" ON public.cart_items;
CREATE POLICY "Public delete cart_items" ON public.cart_items FOR DELETE USING (true);

-- Profile Pictures Policies
DROP POLICY IF EXISTS "Public read profile_pictures" ON public.profile_pictures;
CREATE POLICY "Public read profile_pictures" ON public.profile_pictures FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert profile_pictures" ON public.profile_pictures;
CREATE POLICY "Public insert profile_pictures" ON public.profile_pictures FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update profile_pictures" ON public.profile_pictures;
CREATE POLICY "Public update profile_pictures" ON public.profile_pictures FOR UPDATE USING (true);

-- Message Reactions Policies
DROP POLICY IF EXISTS "Public read message_reactions" ON public.message_reactions;
CREATE POLICY "Public read message_reactions" ON public.message_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert message_reactions" ON public.message_reactions;
CREATE POLICY "Public insert message_reactions" ON public.message_reactions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update message_reactions" ON public.message_reactions;
CREATE POLICY "Public update message_reactions" ON public.message_reactions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete message_reactions" ON public.message_reactions;
CREATE POLICY "Public delete message_reactions" ON public.message_reactions FOR DELETE USING (true);

-- Group Members Policies
DROP POLICY IF EXISTS "Public read group_members" ON public.group_members;
CREATE POLICY "Public read group_members" ON public.group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert group_members" ON public.group_members;
CREATE POLICY "Public insert group_members" ON public.group_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete group_members" ON public.group_members;
CREATE POLICY "Public delete group_members" ON public.group_members FOR DELETE USING (true);

-- Group Media Policies
DROP POLICY IF EXISTS "Public read group_media" ON public.group_media;
CREATE POLICY "Public read group_media" ON public.group_media FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert group_media" ON public.group_media;
CREATE POLICY "Public insert group_media" ON public.group_media FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete group_media" ON public.group_media;
CREATE POLICY "Public delete group_media" ON public.group_media FOR DELETE USING (true);

-- ==============================================================================
-- 23. SEED INITIAL FOUNDERS, DEFAULT STREAM, & LATEST APOSTOLIC SERMON
-- ==============================================================================
DO $$
BEGIN
    -- Ensure unique index or constraint on phone exists before inserting
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass 
        AND contype = 'u' 
        AND conname LIKE '%phone%'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.users'::regclass AND a.attname = 'phone' AND i.indisunique
    ) THEN
        BEGIN
            ALTER TABLE public.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
        EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
        END;
    END IF;

    -- Safely insert initial founding accounts
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE phone = '0772123456') THEN
        INSERT INTO public.users (id, phone, password_hash, full_name, role, member_id, is_verified, cell_group)
        VALUES (gen_random_uuid(), '0772123456', '$2a$12$e8Y7z7rU0b7k4XW0L.zZfeJ6P9r6dC1r1mF3jB6l0nO7z8p4q3m2e', 'Apostle Joe Daniels', 'super_admin', 'GCZ-001-FOUNDER', TRUE, 'Apostolic Directorate');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.users WHERE phone = '0780699988') THEN
        INSERT INTO public.users (id, phone, password_hash, full_name, role, member_id, is_verified, cell_group)
        VALUES (gen_random_uuid(), '0780699988', '$2a$12$K8x9p3r1t0y5w2q7v4m1uO9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4', 'mr_juice7', 'developer', 'GCZ-DEV-007', TRUE, 'Gateway Tech Ministry');
    END IF;
END $$;

-- Seed Primary Live Sanctuary Stream (Church & Politics - Apostle Joe Daniels)
INSERT INTO public.church_settings (id, current_stream_url, updated_at)
VALUES ('primary_stream', 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP', NOW())
ON CONFLICT (id) DO UPDATE SET current_stream_url = EXCLUDED.current_stream_url, updated_at = NOW();

INSERT INTO public.live_streams (id, current_stream_url, title, viewer_count, is_live, updated_at)
VALUES ('active_broadcast', 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP', 'Church & Politics (Controversial Issues) • Apostle Joe Daniels Live', 1429, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET current_stream_url = EXCLUDED.current_stream_url, title = EXCLUDED.title, is_live = TRUE, updated_at = NOW();

-- Seed Featured Sermon: Church & Politics
INSERT INTO public.sermons (title, speaker, series, duration, youtube_id, description, is_live)
SELECT 'Church & Politics (Controversial Issues)', 'Apostle Joe Daniels', 'Apostolic Word', '42m', '-CibsaxijIk', 'Apostle Joe Daniels unpacks controversial issues regarding church, state, and governance with kingdom depth.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.sermons WHERE youtube_id = '-CibsaxijIk');

-- Seed Featured Post: Church & Politics
INSERT INTO public.posts (id, user_id, author_name, author_handle, avatar_url, title, content, category, youtube_id, video_url, image_url, likes_count, comments_count)
VALUES (
    'post_church_and_politics',
    'usr_apostle_joe',
    'Apostle Joe Daniels',
    '@apostle_joe_daniels',
    '/assets/apostle_joe_daniels_main.jpg',
    'Church & Politics (Controversial Issues)',
    'Apostle Joe Daniels unpacks controversial issues regarding church, state, and governance with biblical clarity and kingdom depth.',
    'Apostolic Word',
    '-CibsaxijIk',
    'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP',
    'https://img.youtube.com/vi/-CibsaxijIk/hqdefault.jpg',
    86,
    1
)
ON CONFLICT (id) DO NOTHING;
`;

export const FLUTTER_FILES: Record<string, string> = {
  'pubspec.yaml': `name: gateway_connect
description: "Gateway Connect Mobile App for Apostle Joe Daniels & Gateway Church Zimbabwe"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  # Supabase Flutter SDK
  supabase_flutter: ^2.5.0
  # Animations
  flutter_animate: ^4.5.0
  # Video & Audio Players
  youtube_player_flutter: ^9.0.1
  audioplayers: ^6.0.0
  # Icons & UI
  lucide_icons: ^0.257.0
  google_fonts: ^6.1.0
  intl: ^0.19.0
  cached_network_image: ^3.3.1
  qr_flutter: ^4.1.0
  mobile_scanner: ^5.1.1
  # Local storage & Offline Bible
  shared_preferences: ^2.2.2
  path_provider: ^2.1.2
  # Payments (Ecocash, Paynow, Stripe)
  paynow: ^1.0.2
  flutter_stripe: ^10.1.1
  # Notifications & Links
  flutter_local_notifications: ^17.1.0
  url_launcher: ^6.2.5
  share_plus: ^9.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/bible/
    - assets/images/
    - assets/audio/
`,

  '.env.example': `# ==============================================================================
# GATEWAY CONNECT - API KEYS & ENVIRONMENT CONFIGURATION
# Copy this file to .env or inject during CI/CD build
# ==============================================================================

# 1. SUPABASE (Database, Auth, Storage, Realtime)
# Project Ref: csinlqdcqdgcssdanvsr
SUPABASE_URL=https://csinlqdcqdgcssdanvsr.supabase.co
SUPABASE_ANON_KEY=sb_publishable_TJvwQ_lcZtUL0hHOm1yJmA_rfhpBKEX

# 2. PAYNOW ZIMBABWE (EcoCash, OneMoney, Zimswitch, Visa/Mastercard)
# Get from: https://www.paynow.co.zw
PAYNOW_INTEGRATION_ID=12345
PAYNOW_INTEGRATION_KEY=abcdef-1234-5678-90ab-cdef12345678
PAYNOW_RESULT_URL=https://your-domain.org/api/paynow/webhook
PAYNOW_RETURN_URL=https://your-domain.org/payment/success

# 3. STRIPE (Diaspora USD / GBP / EUR card donations)
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...

# 4. FIREBASE CLOUD MESSAGING (Push Notifications)
# Get from: Firebase Console -> Project Settings -> Cloud Messaging
FCM_SERVER_KEY=AAAA...

# 5. ZOOM API (1-on-1 Pastoral Meeting generation)
# Get from: https://marketplace.zoom.us/develop/create
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
`,

  'lib/main.dart': `import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gateway_connect/core/theme.dart';
import 'package:gateway_connect/core/supabase_config.dart';
import 'package:gateway_connect/screens/main_navigation_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase with client keys
  await Supabase.initialize(
    url: SupabaseConfig.supabaseUrl,
    anonKey: SupabaseConfig.supabaseAnonKey,
  );

  runApp(const GatewayConnectApp());
}

class GatewayConnectApp extends StatelessWidget {
  const GatewayConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gateway Connect',
      debugShowCheckedModeBanner: false,
      theme: ChurchTheme.darkTheme,
      home: const MainNavigationScreen(),
    );
  }
}
`,

  'lib/core/theme.dart': `import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ChurchTheme {
  // Brand Colors: Gold + Navy + White
  static const Color primaryGold = Color(0xFFE5A93C);
  static const Color primaryGoldLight = Color(0xFFFCD34D);
  static const Color backgroundNavy = Color(0xFF091326);
  static const Color cardNavy = Color(0xFF0F1C38);
  static const Color surfaceNavyLight = Color(0xFF15223E);
  static const Color accentEmerald = Color(0xFF10B981);
  static const Color textWhite = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundNavy,
      primaryColor: primaryGold,
      cardColor: cardNavy,
      textTheme: GoogleFonts.plusJakartaSansTextTheme(
        ThemeData(brightness: Brightness.dark).textTheme,
      ),
      colorScheme: const ColorScheme.dark(
        primary: primaryGold,
        secondary: primaryGoldLight,
        surface: cardNavy,
        background: backgroundNavy,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundNavy,
        elevation: 0,
        centerTitle: true,
      ),
    );
  }
}
`,

  'lib/screens/main_navigation_screen.dart': `import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gateway_connect/screens/home_screen.dart';
import 'package:gateway_connect/screens/bible_screen.dart';
import 'package:gateway_connect/screens/community_screen.dart';
import 'package:gateway_connect/screens/store_screen.dart';
import 'package:gateway_connect/screens/me_screen.dart';
import 'package:gateway_connect/core/theme.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    BibleScreen(),
    CommunityScreen(),
    StoreScreen(),
    MeScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: ChurchTheme.cardNavy,
          border: Border(
            top: BorderSide(color: ChurchTheme.primaryGold.withOpacity(0.2), width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: ChurchTheme.cardNavy,
          selectedItemColor: ChurchTheme.primaryGold,
          unselectedItemColor: ChurchTheme.textMuted,
          type: BottomNavigationBarType.fixed,
          selectedFontSize: 12,
          unselectedFontSize: 11,
          items: const [
            BottomNavigationBarItem(icon: Icon(LucideIcons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.bookOpen), label: 'Bible'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.users), label: 'Community'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.shoppingBag), label: 'Store/Give'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.user), label: 'Me'),
          ],
        ),
      ),
    );
  }
}
`,

  'lib/screens/home_screen.dart': `import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gateway_connect/core/theme.dart';
import 'package:gateway_connect/widgets/livestream_player.dart';
import 'package:gateway_connect/widgets/partner_ticker.dart';
import 'package:gateway_connect/widgets/devotional_card.dart';
import 'package:gateway_connect/widgets/sermon_archive_list.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.church, color: ChurchTheme.primaryGold),
            const SizedBox(width: 8),
            Text(
              'GATEWAY CONNECT',
              style: TextStyle(
                fontFamily: 'Cinzel',
                fontWeight: FontWeight.bold,
                color: ChurchTheme.primaryGold,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const PartnerTicker(),
            const SizedBox(height: 12),
            const LivestreamPlayerCard(),
            const SizedBox(height: 16),
            const DevotionalCard(),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Recent Sermons & Prophetic Impartations',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 12),
            const SermonArchiveList(),
          ],
        ),
      ).animate().fadeIn(duration: 400.ms),
    );
  }
}
`
};

export const FLUTTER_EXPORT_DATA = {
  supabaseSql: SUPABASE_SCHEMA_SQL,
  pubspecYaml: FLUTTER_FILES['pubspec.yaml'],
  flutterProjectStructure: `gateway_connect/
├── android/
├── ios/
├── assets/
│   ├── bible/
│   │   ├── kjv.json
│   │   ├── niv.json
│   │   ├── esv.json
│   │   └── shona_bhaibheri.json
│   ├── images/
│   │   ├── apostle_joe_daniels.jpg
│   │   └── gateway_logo.png
│   └── audio/
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── supabase_config.dart
│   │   ├── theme.dart
│   │   └── constants.dart
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── sermon_model.dart
│   │   ├── devotional_model.dart
│   │   ├── donation_model.dart
│   │   ├── prayer_model.dart
│   │   ├── event_model.dart
│   │   ├── product_model.dart
│   │   └── booking_model.dart
│   ├── services/
│   │   ├── supabase_service.dart
│   │   ├── payment_service.dart (Paynow, EcoCash, Stripe)
│   │   ├── audio_player_service.dart (24kbps Low-Data Opus)
│   │   ├── push_notification_service.dart (FCM)
│   │   └── bible_offline_service.dart
│   ├── screens/
│   │   ├── main_navigation_screen.dart
│   │   ├── home_screen.dart
│   │   ├── bible_screen.dart
│   │   ├── community_screen.dart
│   │   ├── store_screen.dart
│   │   ├── me_screen.dart
│   │   ├── admin/
│   │   │   └── admin_panel_screen.dart
│   │   └── dev/
│   │       └── dev_console_screen.dart
│   └── widgets/
│       ├── livestream_player.dart
│       ├── partner_ticker.dart
│       ├── prayer_card.dart
│       └── receipt_dialog.dart
└── pubspec.yaml`,
  dartCodeSamples: FLUTTER_FILES
};
