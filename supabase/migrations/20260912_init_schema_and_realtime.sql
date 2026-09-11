-- ==============================================================================
-- GATEWAY CONNECT: MASTER DATABASE SCHEMA & REALTIME CONFIGURATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    full_name VARCHAR(150) NOT NULL DEFAULT 'Church Member',
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

-- 3. USER FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id VARCHAR(100) NOT NULL,
    following_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.follows (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    follower_id VARCHAR(100) NOT NULL,
    following_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);

-- 4. SERMONS TABLE
CREATE TABLE IF NOT EXISTS public.sermons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 5. POSTS & TESTIMONIES TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- 6. POST COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.post_comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_handle VARCHAR(100),
    user_avatar TEXT,
    text TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    badge_type VARCHAR(50) DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMMUNITY STORIES TABLE
CREATE TABLE IF NOT EXISTS public.community_stories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- 8. CHURCH SETTINGS & LIVE STREAMS
CREATE TABLE IF NOT EXISTS public.church_settings (
    id VARCHAR(100) PRIMARY KEY,
    current_stream_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_streams (
    id VARCHAR(100) PRIMARY KEY,
    current_stream_url TEXT,
    title TEXT,
    viewer_count INT DEFAULT 0,
    is_live BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_streamers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Harare',
    device VARCHAR(50) DEFAULT 'Mobile',
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DEVOTIONALS
CREATE TABLE IF NOT EXISTS public.devotionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 10. DONATIONS TABLE (Paynow Zimbabwe / EcoCash)
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id TEXT,
    donor_name VARCHAR(150) DEFAULT 'Anonymous Covenant Partner',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    fund_type VARCHAR(100) NOT NULL DEFAULT 'Tithe',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'EcoCash',
    payment_gateway VARCHAR(50) DEFAULT 'Paynow Zimbabwe',
    status VARCHAR(50) DEFAULT 'completed',
    receipt_number VARCHAR(100),
    impact_tag VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PRAYER REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 12. SERVICE BOOKINGS
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 13. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 14. PRODUCTS & ORDERS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 15. MESSAGING: GROUP CHATS & DIRECT MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT,
    sender_name VARCHAR(150) NOT NULL DEFAULT 'Church Member',
    sender_avatar TEXT,
    sender_role VARCHAR(50) DEFAULT 'member',
    text TEXT NOT NULL,
    reply_to JSONB,
    media_url TEXT,
    media_type VARCHAR(50),
    is_system BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_by_user_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id VARCHAR(100) NOT NULL,
    receiver_id VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id TEXT NOT NULL,
    chat_type VARCHAR(50) DEFAULT 'group',
    user_id TEXT NOT NULL,
    user_name VARCHAR(150),
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.group_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_media (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT NOT NULL,
    message_id TEXT,
    user_id TEXT NOT NULL,
    user_name VARCHAR(150),
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image',
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. NOTIFICATION SETTINGS & USER ACTIVITIES
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id TEXT PRIMARY KEY,
    live_streams BOOLEAN DEFAULT TRUE,
    prayer_requests BOOLEAN DEFAULT TRUE,
    direct_messages BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CARTS & CART ITEMS
CREATE TABLE IF NOT EXISTS public.carts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

CREATE TABLE IF NOT EXISTS public.profile_pictures (
    user_id TEXT PRIMARY KEY,
    avatar_url TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 18. ROW LEVEL SECURITY (RLS) POLICIES
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
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_pictures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Idempotent Permissive Public Policies for Client App
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'user_follows', 'follows', 'sermons', 'posts', 'post_comments',
        'community_stories', 'church_settings', 'live_streams', 'devotionals',
        'donations', 'prayer_requests', 'service_bookings', 'events', 'products',
        'orders', 'direct_messages', 'messages', 'user_activities', 'live_streamers',
        'carts', 'cart_items', 'profile_pictures', 'message_reactions',
        'group_members', 'group_media', 'notification_settings'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- 19. ENABLE SUPABASE REALTIME REPLICATION (CRITICAL FOR LIVE CHAT & ALERTS)
-- ==============================================================================
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.users; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_pictures; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
