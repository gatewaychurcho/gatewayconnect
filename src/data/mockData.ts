import { 
  User, 
  UserRole,
  Sermon, 
  Devotional, 
  CommunityGroup, 
  PrayerRequest, 
  ChurchEvent, 
  Product, 
  Donation, 
  ServiceBooking, 
  Order, 
  JoeVibesSubmission, 
  PushNotification, 
  Testimony,
  PremiumPlan
} from '../types';

export const DEFAULT_PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'plan_3m',
    durationMonths: 3,
    title: '3 Months Kingdom Pass',
    priceUsd: 30,
    priceZig: 440,
    savings: 'Standard Plan'
  },
  {
    id: 'plan_6m',
    durationMonths: 6,
    title: '6 Months Apostolic Masterclass',
    priceUsd: 60,
    priceZig: 880,
    popular: true,
    savings: 'Most Popular'
  },
  {
    id: 'plan_1y',
    durationMonths: 12,
    title: '1 Year Full Ministry Covenant Access',
    priceUsd: 120,
    priceZig: 1750,
    savings: 'Best Value'
  }
];

export interface DemoAccount {
  name: string;
  roleTitle: string;
  role: UserRole;
  phone: string;
  password: string;
  badge: 'gold' | 'silver' | 'blue' | 'none';
  handle: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Apostle Joe Daniels',
    roleTitle: 'General Overseer & Founder (Super Admin)',
    role: 'super_admin',
    phone: '0772123456',
    password: 'Apostle2026!',
    badge: 'gold',
    handle: '@apostle_joe_daniels',
    description: 'Apostolic oversight over sermons, broadcast streams, altar decrees, and ministerial announcements.'
  },
  {
    name: 'Lead System Developer (mrjuice017)',
    roleTitle: 'Core Systems Developer & Platform Architect',
    role: 'developer',
    phone: '0771445642',
    password: 'Dev2026!',
    badge: 'gold',
    handle: '@mr_juice7',
    description: 'System telemetry, database configuration, offline cache sync, and developer tools.'
  },
  {
    name: 'Pastor Tendai Moyo',
    roleTitle: 'Harare Central Hub Overseer (Moderator)',
    role: 'moderator',
    phone: '0773998877',
    password: 'Pastor2026!',
    badge: 'silver',
    handle: '@pastor_tendai',
    description: 'Community prayer moderation, testimony verification, and cell group coordinator.'
  },
  {
    name: 'Pastor Grace Daniels',
    roleTitle: 'Women of Honor Fellowship (Moderator)',
    role: 'moderator',
    phone: '0775112233',
    password: 'Grace2026!',
    badge: 'gold',
    handle: '@pastor_grace',
    description: 'Prophetic intercession, pastoral guidance for families and women of honor.'
  },
  {
    name: 'Tinashe Chikwava',
    roleTitle: 'Bulawayo North Cell (Covenant Member)',
    role: 'member',
    phone: '0712345678',
    password: 'Member2026!',
    badge: 'blue',
    handle: '@tinashe_zim',
    description: 'Bulawayo tech entrepreneur, covenant partner, and active cell leader.'
  },
  {
    name: 'Chipo Ruvimbo Mandaza',
    roleTitle: 'Worship & Creative Arts Hub Lead',
    role: 'member',
    phone: '0774334455',
    password: 'Chipo2026!',
    badge: 'blue',
    handle: '@chipo_mandaza',
    description: 'Praise and worship team leader, gospel music songwriter, and creative media lead.'
  },
  {
    name: 'Kudakwashe Sibanda',
    roleTitle: 'Campus Ignite Hub President',
    role: 'member',
    phone: '0782112244',
    password: 'Kuda2026!',
    badge: 'blue',
    handle: '@kuda_sibanda',
    description: 'University of Zimbabwe campus revival coordinator and student ministry leader.'
  },
  {
    name: 'Tatenda Blessing Chirwa',
    roleTitle: 'Business & Marketplace Network',
    role: 'member',
    phone: '0778556677',
    password: 'Tatenda2026!',
    badge: 'none',
    handle: '@tatenda_chirwa',
    description: 'Agribusiness founder in Mashonaland, covenant kingdom seed partner.'
  },
  {
    name: 'Nyasha Lorraine Gumbo',
    roleTitle: 'Gateway Media & Broadcast Team',
    role: 'member',
    phone: '0719887766',
    password: 'Nyasha2026!',
    badge: 'blue',
    handle: '@nyasha_gumbo',
    description: 'Livestream audio engineer and diaspora connection liaison.'
  },
  {
    name: 'Farai Takawira',
    roleTitle: 'Chitungwiza Cell & Hospitality Guild',
    role: 'member',
    phone: '0733221100',
    password: 'Farai2026!',
    badge: 'none',
    handle: '@farai_taka',
    description: 'Hospitality and ushering director for national conferences and prayer summits.'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_apostle_joe',
    phone: '0772123456',
    password: 'Apostle2026!',
    full_name: 'Apostle Joe Daniels',
    handle: '@apostle_joe_daniels',
    role: 'super_admin',
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    cell_group: 'Apostolic Directorate',
    bio: 'Founder & General Overseer of Gateway Church. Mandated with Supernatural Acceleration, Kingdom Covenant & Apostolic Authority in Zimbabwe & across the nations.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 28400,
    following_count: 85,
    member_id: 'GCZ-001-FOUNDER',
    baptism_date: '1998-04-12',
    created_at: '2020-01-01T00:00:00Z',
    saved_verses: ['John 1:1', 'Romans 8:28', 'Isaiah 40:31', '1 Kings 18:46'],
    offline_sermon_ids: ['sermon_1', 'sermon_2']
  },
  {
    id: 'usr_developer',
    phone: '0771445642',
    password: 'Dev2026!',
    full_name: 'Lead System Developer (mrjuice017)',
    handle: '@mr_juice7',
    role: 'developer',
    avatar_url: '/assets/apostle_joe_daniels_podcast.jpg',
    cell_group: 'Gateway Tech Ministry',
    bio: 'Platform Architect & Kingdom Technologist. Engineering scalable cloud solutions for Gateway Connect ecosystem.',
    location: 'Harare Innovation Hub',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 4200,
    following_count: 120,
    member_id: 'GCZ-DEV-001',
    created_at: '2023-05-15T00:00:00Z',
    saved_verses: ['Psalms 23:1', 'Proverbs 3:5']
  },
  {
    id: 'usr_pastor_tendai',
    phone: '0773998877',
    password: 'Pastor2026!',
    full_name: 'Pastor Tendai Moyo',
    handle: '@pastor_tendai',
    role: 'moderator',
    referral_code: 'jd#mode',
    avatar_url: '/assets/apostle_joe_daniels_grad.jpg',
    cell_group: 'Harare Central Hub',
    bio: 'Harare Central Hub Overseer. Devoted to pastoral counseling, cell multiplication, and fiery intercessory prayer.',
    location: 'Harare Central, Zimbabwe',
    is_verified: true,
    badge_type: 'silver',
    is_premium: true,
    followers_count: 7800,
    following_count: 240,
    member_id: 'GCZ-MOD-442',
    created_at: '2022-08-10T00:00:00Z',
    saved_verses: ['Matthew 28:19', 'Acts 2:42']
  },
  {
    id: 'usr_pastor_grace',
    phone: '0775112233',
    password: 'Grace2026!',
    full_name: 'Pastor Grace Daniels',
    handle: '@pastor_grace',
    role: 'moderator',
    avatar_url: '/assets/apostle_joe_daniels_preach.jpg',
    cell_group: 'Women of Honor Fellowship',
    bio: 'Mother of the house, leader of Women of Honor. Raising women grounded in holiness, grace, and spiritual discernment.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 11200,
    following_count: 160,
    member_id: 'GCZ-MOD-002',
    created_at: '2021-03-12T00:00:00Z',
    saved_verses: ['Proverbs 31:25', 'Luke 1:45']
  },
  {
    id: 'usr_tinashe',
    phone: '0712345678',
    password: 'Member2026!',
    full_name: 'Tinashe Chikwava',
    handle: '@tinashe_zim',
    role: 'member',
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    cell_group: 'Bulawayo North Cell',
    bio: 'Bulawayo tech entrepreneur & active intercessor. Partnering in the 2026 Cathedral Building Project.',
    location: 'Bulawayo, Zimbabwe',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 1450,
    following_count: 320,
    member_id: 'GCZ-MEM-8921',
    baptism_date: '2021-11-20',
    created_at: '2023-01-14T00:00:00Z',
    saved_verses: ['Psalms 91:1', 'Philippians 4:13']
  },
  {
    id: 'usr_chipo',
    phone: '0774334455',
    password: 'Chipo2026!',
    full_name: 'Chipo Ruvimbo Mandaza',
    handle: '@chipo_mandaza',
    role: 'member',
    avatar_url: '/assets/apostle_joe_daniels_grad.jpg',
    cell_group: 'Worship & Creative Arts Hub',
    bio: 'Gateway Praise & Worship Lead. Living to worship Jesus in spirit and in truth. Songwriter & psalmist.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 3890,
    following_count: 275,
    member_id: 'GCZ-MEM-4311',
    created_at: '2023-07-22T00:00:00Z',
    saved_verses: ['Psalms 100:1-5', 'John 4:24']
  },
  {
    id: 'usr_kuda',
    phone: '0782112244',
    password: 'Kuda2026!',
    full_name: 'Kudakwashe Sibanda',
    handle: '@kuda_sibanda',
    role: 'member',
    avatar_url: '/assets/apostle_joe_daniels_podcast.jpg',
    cell_group: 'Campus Ignite Hub',
    bio: 'UZ Campus Fellowship President. Igniting young hearts with the fire of the Holy Spirit across universities.',
    location: 'Mount Pleasant, Harare',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 2100,
    following_count: 490,
    member_id: 'GCZ-MEM-9920',
    created_at: '2024-02-10T00:00:00Z',
    saved_verses: ['1 Timothy 4:12', 'Joel 2:28']
  },
  {
    id: 'usr_tatenda',
    phone: '0778556677',
    password: 'Tatenda2026!',
    full_name: 'Tatenda Blessing Chirwa',
    handle: '@tatenda_chirwa',
    role: 'member',
    avatar_url: '/assets/apostle_joe_daniels_preach.jpg',
    cell_group: 'Business & Professionals Network',
    bio: 'Marketplace partner & agribusiness founder in Mashonaland East. Standing on Deuteronomy 8:18.',
    location: 'Marondera, Zimbabwe',
    is_verified: false,
    badge_type: 'none',
    is_premium: true,
    followers_count: 940,
    following_count: 210,
    member_id: 'GCZ-MEM-1044',
    created_at: '2023-11-05T00:00:00Z',
    saved_verses: ['Deuteronomy 8:18', 'Malachi 3:10']
  },
  {
    id: 'usr_nyasha',
    phone: '0719887766',
    password: 'Nyasha2026!',
    full_name: 'Nyasha Lorraine Gumbo',
    handle: '@nyasha_gumbo',
    role: 'member',
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    cell_group: 'Gateway Media & Broadcast',
    bio: 'Broadcast director. Connecting thousands of diaspora believers to the prophetic altar of Gateway Church.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 2600,
    following_count: 310,
    member_id: 'GCZ-MEM-5512',
    created_at: '2023-09-18T00:00:00Z',
    saved_verses: ['Mark 16:15', 'Isaiah 52:7']
  },
  {
    id: 'usr_farai',
    phone: '0733221100',
    password: 'Farai2026!',
    full_name: 'Farai Takawira',
    handle: '@farai_taka',
    role: 'member',
    avatar_url: '/assets/apostle_joe_daniels_podcast.jpg',
    cell_group: 'Chitungwiza Community Cell',
    bio: 'Dedicated to serving in the house of the Lord. Believing God for supernatural acceleration in 2026.',
    location: 'Chitungwiza, Zimbabwe',
    is_verified: false,
    badge_type: 'none',
    is_premium: false,
    followers_count: 730,
    following_count: 260,
    member_id: 'GCZ-MEM-7731',
    created_at: '2024-04-01T00:00:00Z',
    saved_verses: ['Psalms 84:10', 'Colossians 3:23']
  },
  {
    id: 'usr_guest',
    phone: '0770000000',
    password: 'Guest2026!',
    full_name: 'Guest Believer',
    handle: '@guest_believer',
    role: 'guest',
    avatar_url: '',
    cell_group: 'Visitor / Guest',
    is_verified: false,
    badge_type: 'none',
    is_premium: false,
    followers_count: 0,
    following_count: 0,
    member_id: 'GCZ-GST-000',
    created_at: '2026-01-01T00:00:00Z',
    saved_verses: []
  }
];

export const MOCK_SERMONS: Sermon[] = [
  {
    id: 'sermon_1',
    title: 'Supernatural Acceleration: Stepping Into Divine Speed',
    speaker: 'Apostle Joe Daniels',
    date: 'Last Sunday • 10:00 AM CAT',
    series: 'Prophetic Dimensions 2026',
    duration: '1h 14m',
    youtube_id: '-ISesn4nJvM',
    thumbnail_url: '/assets/apostle_joe_daniels_preach.jpg',
    scriptures: ['1 Kings 18:46', 'Amos 9:13', 'Habakkuk 2:3'],
    description: 'When the hand of the Lord rests upon a believer, divine acceleration defies human logic. Hear how God is shifting families and businesses in Zimbabwe and the diaspora.',
    view_count: 14200,
    is_live: true,
    is_premium: false,
    notes: 'Key Takeaways:\n1. The hand of God brings effortless speed.\n2. Elijah outran the chariot of Ahab.\n3. Your prayer life is your engine of supernatural lift.'
  },
  {
    id: 'sermon_2',
    title: 'Breaking Generational Limitations Through Kingdom Covenant',
    speaker: 'Apostle Joe Daniels',
    date: 'Aug 27, 2026',
    series: 'Covenant Secrets',
    duration: '58m',
    snippet_duration: '0:45 Preview',
    is_premium: true,
    unlock_price_usd: 5,
    youtube_id: 'LXb3EKWsInQ',
    thumbnail_url: '/assets/apostle_joe_daniels_grad.jpg',
    scriptures: ['Galatians 3:13-14', 'Deuteronomy 28:1-14'],
    description: 'Exclusive Apostolic Masterclass: Understand the legal spiritual authority of the blood of Jesus to sever ancestry setbacks and activate generational blessings.',
    view_count: 9850,
    notes: 'Blood covenant supersedes earthly decree. Stand fast in liberty.'
  },
  {
    id: 'sermon_3',
    title: 'The Mystery of Seed & Harvest in Famine Seasons',
    speaker: 'Apostle Joe Daniels',
    date: 'Aug 20, 2026',
    series: 'Kingdom Economics',
    duration: '1h 05m',
    snippet_duration: '0:45 Preview',
    is_premium: true,
    unlock_price_usd: 5,
    youtube_id: 'pGY8Bi1F4qw',
    thumbnail_url: '/assets/apostle_joe_daniels_podcast.jpg',
    scriptures: ['Genesis 26:12', '2 Corinthians 9:6-10'],
    description: 'Isaac sowed in the land of drought and reaped a hundredfold in the same year because he trusted the covenant.',
    view_count: 12400
  },
  {
    id: 'sermon_4',
    title: 'Empowered by the Holy Spirit: Walking in Gifts & Wisdom',
    speaker: 'Pastor Grace Daniels',
    date: 'Aug 13, 2026',
    series: 'Holy Ghost Encounter',
    duration: '45m',
    youtube_id: '0cOqgAdyS_s',
    thumbnail_url: '/assets/apostle_joe_daniels_preach.jpg',
    scriptures: ['Acts 1:8', '1 Corinthians 12:4-11'],
    description: 'The Holy Spirit is not just power for the pulpit, but divine intelligence for your daily decisions.',
    view_count: 8100
  },
  {
    id: 'sermon_5',
    title: 'Overcoming the Spirit of Delay & Stagnation',
    speaker: 'Apostle Joe Daniels',
    date: 'Aug 06, 2026',
    series: 'Deliverance & Victory',
    duration: '1h 22m',
    youtube_id: '9bZkp7q19f0',
    thumbnail_url: '/assets/apostle_joe_daniels_main.jpg',
    scriptures: ['Daniel 10:12-14', 'Psalms 102:13'],
    description: 'The set time to favor Zion has come. Learn how to press through spiritual resistance into sudden breakthrough.',
    view_count: 16900
  }
];

export const MOCK_DEVOTIONALS: Devotional[] = [
  {
    id: 'dev_today',
    date: 'Today • 2 September 2026',
    title: 'Divine Remembrance: God Has Not Forgotten You',
    scripture_reference: 'Isaiah 49:15-16',
    scripture_verse: '"Can a mother forget the baby at her breast and have no compassion on the child she has borne? Though she may forget, I will not forget you! See, I have engraved you on the palms of my hands."',
    content: 'Beloved, when delay seems prolonged, the enemy whispers that heaven is silent. But God says your name is engraved upon His palms. Every prayer you prayed over your family, your health, and your career in Zimbabwe or across the nations is before the altar of incense. Today, step out with high expectation!',
    prayer: 'Heavenly Father, I thank You that You are mindful of me. I rebuke every spirit of discouragement. Your promises over my destiny are YES and AMEN in Christ Jesus.',
    declaration: 'I declare that this day marks the beginning of unusual favor, open doors, and restored peace in Jesus name!',
    audio_duration: '3m 45s',
    author: 'Apostle Joe Daniels'
  },
  {
    id: 'dev_yesterday',
    date: '1 September 2026',
    title: 'The Atmosphere of Gratitude',
    scripture_reference: '1 Thessalonians 5:18',
    scripture_verse: '"In everything give thanks; for this is the will of God in Christ Jesus for you."',
    content: 'Gratitude is not a reaction to good news; it is the generator of supernatural victory. Praise God in the hallway before the door opens.',
    prayer: 'Lord, I choose thanksgiving over anxiety today. Fill my heart with songs of deliverance.',
    declaration: 'My praise confuses the enemy and unlocks my breakthrough!',
    audio_duration: '4m 10s',
    author: 'Apostle Joe Daniels'
  }
];

export const MOCK_PARTNER_TICKERS = [
  '⚡ Harare Crusade 2026: 2,450 decisions for Christ & 180 confirmed healings!',
  '🌍 Gateway Diaspora Chapel: Connecting 14 nations weekly across UK, US, SA & Canada',
  '🌾 Chitungwiza Community Food Basket: 450 vulnerable families supported this month',
  '📖 Shona Audio Bible Initiative: 12,000 chapters streamed offline in rural Mashonaland',
  '🏛️ Gateway Cathedral Building Project: Phase 2 Roofing completed to the Glory of God!'
];

export const MOCK_COMMUNITY_GROUPS: CommunityGroup[] = [
  {
    id: 'grp_1',
    name: 'Harare Central Grace Cell',
    category: 'Location',
    location: 'Avondale & CBD, Harare',
    leader_name: 'Elder Brian Sibanda',
    leader_phone: '+263 77 312 3456',
    meeting_time: 'Wednesdays @ 6:00 PM CAT',
    member_count: 48,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'A vibrant family meeting weekly for deep fellowship, prayer walks, and mutual encouragement across Harare.',
    joined: true
  },
  {
    id: 'grp_2',
    name: 'Gateway UK & European Diaspora',
    category: 'Diaspora',
    location: 'London / Birmingham / Online Zoom',
    leader_name: 'Pastor Rudo Mwale',
    leader_phone: '+44 79 1122 3344',
    meeting_time: 'Thursdays @ 8:00 PM BST',
    member_count: 124,
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    description: 'Uniting Zimbabweans and believers across the UK, Ireland, and mainland Europe in prayer and kingdom support.',
    joined: false
  },
  {
    id: 'grp_3',
    name: 'Youth Ignite & Campus OnFire',
    category: 'Youth',
    location: 'UZ & Gateway Youth Center',
    leader_name: 'Minister Taku Daniels',
    leader_phone: '+263 78 456 7890',
    meeting_time: 'Saturdays @ 3:00 PM CAT',
    member_count: 95,
    image_url: '/assets/apostle_joe_daniels_grad.jpg',
    description: 'High energy worship, relevant discussions, mentorship, and creative arts (music, design, media).',
    joined: false
  },
  {
    id: 'grp_4',
    name: 'Gateway Kingdom Business Network',
    category: 'Business',
    location: 'Borrowdale & Virtual',
    leader_name: 'Deacon Charles Mutasa',
    leader_phone: '+263 77 987 6543',
    meeting_time: '1st Saturday of Month @ 8:00 AM',
    member_count: 67,
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    description: 'Empowering Christian entrepreneurs, tenders, trade, and financial stewardship with biblical integrity.',
    joined: false
  }
];

export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: 'pray_1',
    user_name: 'Sister Chiedza M.',
    is_anonymous: false,
    category: 'Healing',
    request_text: 'Please agree with me in prayer for my mother scheduled for surgery in Bulawayo. We stand on Isaiah 53:5 for complete wholeness.',
    is_answered: true,
    answered_testimony: 'Praise the Lord! The doctors ran tests before surgery and the tumor was completely gone! Glory to God!',
    prayer_count: 142,
    user_prayed: true,
    created_at: '2026-08-30T10:15:00Z',
    apostle_notes: 'Amen! The healing power of Jesus is confirmed in her body.',
    is_public: true,
    status: 'apostle_prayed'
  },
  {
    id: 'pray_2',
    user_name: 'Brother in Diaspora',
    is_anonymous: true,
    category: 'Financial Breakthrough',
    request_text: 'Seeking God for my visa renewal and a permanent contract in the UK. Believing Apostle Joe Daniels word of supernatural acceleration.',
    is_answered: false,
    prayer_count: 89,
    user_prayed: false,
    created_at: '2026-09-01T14:30:00Z',
    apostle_notes: 'I decree divine speed over your immigration papers in Jesus name.',
    is_public: true,
    status: 'approved'
  },
  {
    id: 'pray_3',
    user_name: 'Tatenda K.',
    is_anonymous: false,
    category: 'Family & Marriage',
    request_text: 'Praying for restoration of peace in our marriage and spiritual breakthrough for my husband.',
    is_answered: false,
    prayer_count: 63,
    user_prayed: false,
    created_at: '2026-09-01T19:00:00Z',
    is_public: true,
    status: 'approved'
  }
];

export const MOCK_EVENTS: ChurchEvent[] = [
  {
    id: 'evt_1',
    title: 'Supernatural Acceleration Conference 2026',
    date: 'Sept 18 - 20, 2026',
    time: '5:30 PM Nightly • 9:00 AM Sunday',
    location: 'Gateway Cathedral, Belvedere, Harare',
    description: 'Three explosive days of the prophetic word, miraculous healing, worship, and apostolic impartation with Apostle Joe Daniels & International Guests.',
    banner_url: '/assets/apostle_joe_daniels_preach.jpg',
    rsvp_count: 1840,
    user_rsvpd: true,
    category: 'Conference',
    speaker: 'Apostle Joe Daniels & Guests',
    is_featured: true,
    ticket_required: false
  },
  {
    id: 'evt_2',
    title: 'Night of Total Deliverance & Prophecy',
    date: 'Last Friday of Sept',
    time: '9:00 PM - 5:00 AM CAT',
    location: 'Main Auditorium & Live Stream',
    description: 'An all-night prayer vigil breaking covenants of delay, witchcraft, poverty, and sickness.',
    banner_url: '/assets/apostle_joe_daniels_podcast.jpg',
    rsvp_count: 920,
    user_rsvpd: false,
    category: 'All-Night Prayer',
    speaker: 'Apostle Joe Daniels',
    is_featured: false
  },
  {
    id: 'evt_3',
    title: 'Kingdom Business & Marketplace Summit',
    date: 'Oct 10, 2026',
    time: '8:30 AM - 2:00 PM CAT',
    location: 'Meikles Hotel & Virtual',
    description: 'Strategic kingdom wealth creation, diaspora investments in Zimbabwe, and business anointing.',
    banner_url: '/assets/apostle_joe_daniels_main.jpg',
    rsvp_count: 310,
    user_rsvpd: false,
    category: 'Sunday Service',
    speaker: 'Apostle Joe Daniels & Industry Leaders',
    is_featured: false,
    ticket_required: true,
    ticket_price_usd: 25
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_tshirt_1',
    name: 'Apostle Joe Daniels Signature Ministry T-Shirt (Midnight Navy & Gold)',
    category: 'Kingdom Apparel',
    price_usd: 18,
    price_zig: 260,
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    description: '100% premium combed cotton t-shirt featuring the iconic Apostle Joe Daniels ministry crest, gold foil typography, and prophetic scripture across the sleeve.',
    author_or_brand: 'Apostle Joe Daniels Apparel',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_tshirt_2',
    name: 'Joe Daniels "Supernatural Acceleration" Premium T-Shirt (White & Gold)',
    category: 'Kingdom Apparel',
    price_usd: 18,
    price_zig: 260,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'Official 2026 conference edition t-shirt celebrating divine acceleration and kingdom victory in Zimbabwe and globally.',
    author_or_brand: 'Apostle Joe Daniels Apparel',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_1',
    name: 'Unlocking Supernatural Acceleration (Hardcover Book)',
    category: 'Books',
    price_usd: 15,
    price_zig: 220,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'The definitive spiritual blueprint on activating divine speed, breaking cycles of delay, and receiving prophetic elevation by Apostle Joe Daniels.',
    author_or_brand: 'Apostle Joe Daniels',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_2',
    name: 'The Prophetic Dimension: Hearing God with Precision (Book)',
    category: 'Books',
    price_usd: 12,
    price_zig: 180,
    image_url: '/assets/apostle_joe_daniels_grad.jpg',
    description: 'A biblical guide to discerning the voice of the Holy Spirit, angelic visitations, and prophetic clarity in the modern world.',
    author_or_brand: 'Apostle Joe Daniels',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_book_3',
    name: 'Walking in the Supernatural & Covenant Wealth (Book)',
    category: 'Books',
    price_usd: 16,
    price_zig: 235,
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    description: 'Authoritative teachings on biblical financial covenants, sowing in famine, and overcoming economic limitations.',
    author_or_brand: 'Apostle Joe Daniels',
    in_stock: true,
    is_bestseller: false
  },
  {
    id: 'prod_3',
    name: 'Gateway Official Navy & Gold Kingdom Hoodie',
    category: 'Kingdom Apparel',
    price_usd: 28,
    price_zig: 410,
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    description: 'Premium heavyweight cotton hoodie with embroidered Gateway Church Zimbabwe crest and scripture cuff.',
    in_stock: true,
    is_bestseller: false
  },
  {
    id: 'prod_4',
    name: 'Apostolic Impartation Anointing Oil (Set of 3)',
    category: 'Anointing Oil & Media',
    price_usd: 10,
    price_zig: 150,
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    description: 'Consecrated frankincense and myrrh oil for family dedication, home blessing, and prayer.',
    in_stock: true,
    is_bestseller: false
  },
  {
    id: 'prod_5',
    name: 'VIP Delegate Pass: Acceleration Conference',
    category: 'Conference Passes',
    price_usd: 50,
    price_zig: 750,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'Includes reserved front seating, exclusive dinner session with Apostle Joe Daniels, and signed book copy.',
    in_stock: true,
    is_bestseller: false
  }
];

export const MOCK_DONATIONS: Donation[] = [
  {
    id: 'don_101',
    donor_name: 'Covenant Partner (Private)',
    amount: 150,
    currency: 'USD',
    fund_type: 'Tithe',
    payment_method: 'EcoCash',
    status: 'completed',
    receipt_number: 'GCZ-RC-2026-8891',
    created_at: '2026-09-01T16:20:00Z',
    impact_tag: 'Harare Evangelism Outreaches',
    is_anonymous: false
  },
  {
    id: 'don_102',
    donor_name: 'Diaspora Partner UK',
    amount: 250,
    currency: 'GBP',
    fund_type: 'Building Foundation',
    payment_method: 'Stripe',
    status: 'completed',
    receipt_number: 'GCZ-RC-2026-8892',
    created_at: '2026-09-01T18:45:00Z',
    impact_tag: 'Cathedral Roofing Phase',
    is_anonymous: true
  },
  {
    id: 'don_103',
    donor_name: 'Faithful Seed Partner',
    amount: 1200,
    currency: 'ZiG',
    fund_type: 'Seed Faith',
    payment_method: 'Paynow',
    status: 'completed',
    receipt_number: 'GCZ-RC-2026-8893',
    created_at: '2026-09-02T02:10:00Z',
    impact_tag: 'Chitungwiza Food Outreach',
    is_anonymous: false
  }
];

export const MOCK_BOOKINGS: ServiceBooking[] = [
  {
    id: 'bk_1',
    user_name: 'Tinashe Chikwava',
    user_phone: '+263 71 234 5678',
    user_email: 'tinashe@gatewayzim.org',
    service_type: 'Prophetic Mentorship',
    date: '2026-09-10',
    time_slot: '02:00 PM CAT',
    status: 'confirmed',
    deposit_amount: 30,
    deposit_paid: true,
    zoom_link: 'https://zoom.us/j/98437291823?pwd=GATEWAY_CONNECT',
    notes: 'Seeking direction for new business launch in Southern Africa.',
    reminder_phone: '+263 71 234 5678',
    created_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bk_2',
    user_name: 'Makanaka Sibanda (Diaspora)',
    user_phone: '+44 77 8899 0011',
    user_email: 'makanaka.uk@gmail.com',
    service_type: 'Pastoral Counseling',
    date: '2026-09-12',
    time_slot: '04:30 PM BST',
    status: 'pending',
    deposit_amount: 50,
    deposit_paid: true,
    zoom_link: 'https://zoom.us/j/81239019284?pwd=GATEWAY_CONNECT',
    notes: 'Family blessing and spiritual encouragement.',
    reminder_phone: '+44 77 8899 0011',
    created_at: '2026-09-02T01:30:00Z'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_901',
    user_name: 'Tatenda K.',
    user_phone: '+263 77 111 2233',
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 1 },
      { product: MOCK_PRODUCTS[2], quantity: 1, selectedSize: 'L' }
    ],
    total_usd: 43,
    payment_method: 'EcoCash',
    status: 'Processing',
    delivery_address: '14 Samora Machel Ave, Harare CBD',
    created_at: '2026-09-01T12:00:00Z'
  }
];

export const MOCK_JOE_VIBES: JoeVibesSubmission[] = [
  {
    id: 'vibes_1',
    artist_name: 'Minister Blessed Moyo',
    song_title: 'Mweya Mutsvene (Holy Spirit Overflow)',
    genre: 'Worship',
    audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    contact_phone: '+263 77 444 5566',
    status: 'approved',
    submitted_at: '2026-08-28T14:00:00Z',
    notes: 'Phenomenal acoustic worship piece in Shona and English. Scheduled for Sunday choir special.'
  },
  {
    id: 'vibes_2',
    artist_name: 'Kingdom Flow Crew',
    song_title: 'Unstoppable Grace (Afrobeat Mix)',
    genre: 'Afro-Gospel',
    audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    contact_phone: '+263 78 999 1122',
    status: 'submitted',
    submitted_at: '2026-09-01T17:20:00Z',
    notes: 'High energy praise submitted for Youth Ignite.'
  }
];

export const MOCK_TESTIMONIES: Testimony[] = [
  {
    id: 'post_apostle_preaching',
    user_id: 'usr_apostle_joe',
    user_name: 'Apostle Joe Daniels',
    user_handle: '@apostle_joe_daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Prophetic Decree: The Hand of the Lord Brings Divine Speed',
    category: 'Prophetic Word',
    content: 'God is positioning you right now for supernatural acceleration! What took your family 10 years to achieve, the Holy Ghost will release in 10 months. Step boldly into the altar of agreement and declare that stagnation is broken over your life, career, and household!',
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    scripture_tag: '1 Kings 18:46',
    date: '10 minutes ago',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_pastor_tendai', 'usr_pastor_grace', 'usr_tinashe', 'usr_chipo', 'usr_kuda'],
    likes_count: 5,
    verified_by_church: true,
    comments_count: 2,
    comments: [
      {
        id: 'comm_1',
        user_id: 'usr_pastor_tendai',
        user_name: 'Pastor Tendai Moyo',
        user_handle: '@pastor_tendai',
        user_avatar: '/assets/apostle_joe_daniels_grad.jpg',
        text: 'Amen my father! We stand in apostolic alignment with this word across Harare Central Hub! 🔥🙏',
        created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        likes_count: 3,
        badge_type: 'silver'
      },
      {
        id: 'comm_2',
        user_id: 'usr_chipo',
        user_name: 'Chipo Ruvimbo Mandaza',
        user_handle: '@chipo_mandaza',
        user_avatar: '/assets/apostle_joe_daniels_grad.jpg',
        text: 'Receiving this divine acceleration in Jesus mighty name! Stagnation is broken! ❤️🙌',
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        likes_count: 2,
        badge_type: 'blue'
      }
    ]
  },
  {
    id: 'post_pastor_tendai_altar',
    user_id: 'usr_pastor_tendai',
    user_name: 'Pastor Tendai Moyo',
    user_handle: '@pastor_tendai',
    user_avatar: '/assets/apostle_joe_daniels_grad.jpg',
    title: 'Midweek Altar Fire & Cell Group Intercession',
    category: 'Spiritual Growth',
    content: 'Powerful fellowship at the Harare Central Hub tonight! When believers assemble in unity, territorial strongholds give way. Don’t neglect the assembly of the saints — your victory is wrapped in corporate agreement.',
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    scripture_tag: 'Acts 2:42',
    date: '5 hrs ago',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_apostle_joe', 'usr_tinashe', 'usr_farai'],
    likes_count: 3,
    verified_by_church: true,
    comments_count: 1,
    comments: [
      {
        id: 'comm_3',
        user_id: 'usr_apostle_joe',
        user_name: 'Apostle Joe Daniels',
        user_handle: '@apostle_joe_daniels',
        user_avatar: '/assets/apostle_joe_daniels_main.jpg',
        text: 'Grace upon you Pastor Tendai. Keep the altar of prayer burning night and day.',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likes_count: 4,
        badge_type: 'gold'
      }
    ]
  },
  {
    id: 'post_chipo_worship',
    user_id: 'usr_chipo',
    user_name: 'Chipo Ruvimbo Mandaza',
    user_handle: '@chipo_mandaza',
    user_avatar: '/assets/apostle_joe_daniels_grad.jpg',
    title: 'New Altar Praise: Worship Preparation for Sunday Service',
    category: 'Praise & Testimony',
    content: 'Rehearsing with the worship choir today and the weight of God’s glory filled the sanctuary. Get ready for an unusual move of the Holy Ghost this Sunday at Gateway Church!',
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    scripture_tag: 'Psalms 100:4',
    date: '1 day ago',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_kuda', 'usr_nyasha'],
    likes_count: 2,
    verified_by_church: true,
    comments_count: 0,
    comments: []
  },
  {
    id: 'post_kuda_campus',
    user_id: 'usr_kuda',
    user_name: 'Kudakwashe Sibanda',
    user_handle: '@kuda_sibanda',
    user_avatar: '/assets/apostle_joe_daniels_podcast.jpg',
    title: 'Campus Ignite: Over 40 Students Gave Their Lives to Christ!',
    category: 'Youth & Campus',
    content: 'The fire of revival is sweeping across the University of Zimbabwe campus! During our lunch hour fellowship, 42 young souls gave their lives to Jesus Christ and 15 received baptism of the Holy Spirit with speaking in tongues. The youth are on fire for the Lord!',
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    scripture_tag: 'Joel 2:28',
    date: '3 days ago',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_tinashe', 'usr_chipo', 'usr_nyasha', 'usr_farai'],
    likes_count: 4,
    verified_by_church: true,
    comments_count: 1,
    comments: [
      {
        id: 'comm_4',
        user_id: 'usr_tinashe',
        user_name: 'Tinashe Chikwava',
        user_handle: '@tinashe_zim',
        user_avatar: '/assets/apostle_joe_daniels_main.jpg',
        text: 'Glorious report Kuda! We are praying for Campus Ignite from Bulawayo!',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        likes_count: 1,
        badge_type: 'blue'
      }
    ]
  },
  {
    id: 'post_tinashe_testimony',
    user_id: 'usr_tinashe',
    user_name: 'Tinashe Chikwava',
    user_handle: '@tinashe_zim',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Financial Miracle: 3-Year Debt Completely Cleared',
    category: 'Financial Breakthrough',
    content: 'After Apostle Joe Daniels prayed for covenant business partners on the broadcast, a supplier unexpectedly credited our business account and cancelled our lingering US$4,500 equipment debt in writing! What God cannot do does not exist!',
    image_url: '/assets/apostle_joe_daniels_grad.jpg',
    scripture_tag: 'Amos 9:13',
    date: 'a week ago',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_apostle_joe', 'usr_pastor_grace', 'usr_tatenda'],
    likes_count: 3,
    verified_by_church: true,
    comments_count: 0,
    comments: []
  },
  {
    id: 'post_tatenda_marketplace',
    user_id: 'usr_tatenda',
    user_name: 'Tatenda Blessing Chirwa',
    user_handle: '@tatenda_chirwa',
    user_avatar: '/assets/apostle_joe_daniels_preach.jpg',
    title: 'Supernatural Crop Yield in Famine Season',
    category: 'Financial Breakthrough',
    content: 'While other farmers in our district faced water scarcity, we sowed our seed into the Cathedral Foundation project. The Lord blessed our harvest with triple the projected yield! Sowing into the kingdom works.',
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    scripture_tag: 'Genesis 26:12',
    date: 'a month ago',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_pastor_tendai'],
    likes_count: 1,
    verified_by_church: false,
    comments_count: 0,
    comments: []
  }
];

export const MOCK_PUSH_NOTIFICATIONS: PushNotification[] = [
  {
    id: 'push_1',
    title: '🔴 Apostle Joe Daniels is LIVE!',
    body: 'Tune in now for "Supernatural Acceleration" - Prophet impartation is flowing!',
    target_segment: 'All Members',
    sent_at: '2026-09-01T08:00:00Z',
    read_count: 3420
  },
  {
    id: 'push_2',
    title: '📖 Today\'s Devotional: Divine Remembrance',
    body: 'God has engraved your name on His hands. Read today\'s reflection.',
    target_segment: 'All Members',
    sent_at: '2026-09-02T04:00:00Z',
    read_count: 1890
  }
];
