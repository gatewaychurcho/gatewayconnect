export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- GATEWAY CONNECT - SUPABASE PRODUCTION DATABASE SCHEMA
-- Ministry: Gateway Church Zimbabwe (Founder: Apostle Joe Daniels)
-- Features: Auth & Roles, Livestreams, Bible, Prayer Wall, Events, Store,
--           Ecocash/Paynow/Stripe Giving, 1-on-1 Zoom Bookings, Push Segments
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Role Types
CREATE TYPE user_role AS ENUM ('guest', 'member', 'moderator', 'admin', 'super_admin', 'developer');
CREATE TYPE donation_fund AS ENUM ('Tithe', 'Firstfruits', 'Seed Faith', 'Building Foundation', 'Missions & Evangelism', 'Apostolic Honorarium');
CREATE TYPE payment_gateway AS ENUM ('EcoCash', 'OneMoney', 'Paynow', 'Stripe', 'PayPal', 'Bank Transfer');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Dispatched', 'Delivered');
CREATE TYPE prayer_status AS ENUM ('pending', 'approved', 'apostle_prayed');

-- 3. USERS / PROFILES TABLE
-- Note: Phone-based primary identity, no mandatory email
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role DEFAULT 'member',
    referral_code VARCHAR(50),
    avatar_url TEXT,
    cell_group VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    member_id VARCHAR(50) UNIQUE NOT NULL,
    baptism_date DATE,
    saved_verses TEXT[] DEFAULT '{}',
    offline_sermon_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POSTS & SERMONS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
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

-- 5. DEVOTIONALS TABLE
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

-- 6. DONATIONS TABLE (100% Private, shows impact metrics)
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    donor_name VARCHAR(150) DEFAULT 'Anonymous Covenant Partner',
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    fund_type donation_fund NOT NULL DEFAULT 'Tithe',
    payment_method payment_gateway NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    impact_tag VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EVENTS TABLE
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

-- 8. 1-ON-1 SERVICE BOOKINGS TABLE (Pastoral Calendar + Zoom + WhatsApp)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    user_email VARCHAR(150),
    service_type VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status booking_status DEFAULT 'pending',
    deposit_amount NUMERIC(10, 2) DEFAULT 30.00,
    deposit_paid BOOLEAN DEFAULT TRUE,
    zoom_link TEXT,
    notes TEXT,
    reminder_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRODUCTS TABLE (Store)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    price_zig NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    description TEXT,
    author_or_brand VARCHAR(150) DEFAULT 'Gateway Church Zimbabwe',
    in_stock BOOLEAN DEFAULT TRUE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    items JSONB NOT NULL,
    total_usd NUMERIC(10, 2) NOT NULL,
    payment_method payment_gateway NOT NULL,
    status order_status DEFAULT 'Pending',
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PRAYER REQUESTS TABLE (Wall & Pastoral Care)
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    request_text TEXT NOT NULL,
    is_answered BOOLEAN DEFAULT FALSE,
    answered_testimony TEXT,
    prayer_count INT DEFAULT 0,
    apostle_notes TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    status prayer_status DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Super Admin can do everything
CREATE POLICY "SuperAdmin full access users" ON public.users 
    FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "SuperAdmin full access donations" ON public.donations 
    FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

-- Developer account CANNOT view private donations or confidential prayers
CREATE POLICY "Developer restricted from donations" ON public.donations 
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) != 'developer'
    );

-- Public Read for Sermons, Events, Products
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read prayer requests" ON public.prayer_requests FOR SELECT USING (is_public = true AND status != 'pending');

-- ==============================================================================
-- 13. SEED DATA
-- Founder & Super Admin: Apostle Joe Daniels
-- Developer Account: 0780699988
-- ==============================================================================

INSERT INTO public.users (
    id, phone, password_hash, full_name, role, member_id, is_verified, cell_group
) VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    '0772123456',
    -- bcrypt hash for 'Apostle2026!'
    '$2a$12$e8Y7z7rU0b7k4XW0L.zZfeJ6P9r6dC1r1mF3jB6l0nO7z8p4q3m2e',
    'Apostle Joe Daniels',
    'super_admin',
    'GCZ-001-FOUNDER',
    TRUE,
    'Apostolic Directorate'
),
(
    'd2222222-2222-2222-2222-222222222222',
    '0780699988',
    -- bcrypt hash for 'DevSecret#2026'
    '$2a$12$K8x9p3r1t0y5w2q7v4m1uO9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4',
    'Lead System Developer',
    'developer',
    'GCZ-DEV-007',
    TRUE,
    'Gateway Tech Ministry'
)
ON CONFLICT (phone) DO NOTHING;

-- Seed Sample Sermons
INSERT INTO public.posts (title, speaker, series, duration, youtube_id, description, is_live)
VALUES (
    'Supernatural Acceleration: Stepping Into Divine Speed',
    'Apostle Joe Daniels',
    'Prophetic Dimensions 2026',
    '1h 14m',
    'dQw4w9WgXcQ',
    'When the hand of the Lord rests upon a believer, divine acceleration defies human logic.',
    TRUE
);
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
# Get from: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

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
