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
  PremiumPlan,
  ChatGroup,
  ChatGroupMessage
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
    name: 'Prophetess Melinda Daniels',
    roleTitle: 'Co-Founder & General Overseer (Super Admin)',
    role: 'super_admin',
    phone: '0775112233',
    password: 'Prophetess2026!',
    badge: 'gold',
    handle: '@prophetess_melinda',
    description: 'Co-Founder & General Overseer, Passion Ladies Director. Apostolic and Prophetic Grace.'
  },
  {
    name: 'Pastor Easter',
    roleTitle: 'National Executive Overseer (Super Admin)',
    role: 'super_admin',
    phone: '0771889900',
    password: 'PastorEaster2026!',
    badge: 'gold',
    handle: '@pastor_easter',
    description: 'National Executive Overseer & Apostolic Administrator. Global kingdom governance.'
  },
  {
    name: 'mr_juice7',
    roleTitle: 'Core Systems Developer & Platform Architect',
    role: 'developer',
    phone: '0780699988',
    password: 'juice2026',
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
    followers_count: 8,
    following_count: 2,
    member_id: 'GCZ-001-FOUNDER',
    baptism_date: '1998-04-12',
    created_at: '2020-01-01T00:00:00Z',
    saved_verses: ['John 1:1', 'Romans 8:28', 'Isaiah 40:31', '1 Kings 18:46'],
    offline_sermon_ids: ['sermon_1', 'sermon_2']
  },
  {
    id: 'usr_prophetess_melinda',
    phone: '0775112233',
    password: 'Prophetess2026!',
    full_name: 'Prophetess Melinda Daniels',
    handle: '@prophetess_melinda',
    role: 'super_admin',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Passion Ladies Directorate',
    bio: 'Co-Founder & General Overseer, Passion Ladies Director. Apostolic and Prophetic teacher raising women of honor, prayer, and faith.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 1420,
    following_count: 2,
    member_id: 'GCZ-002-FOUNDER',
    baptism_date: '2001-08-15',
    created_at: '2020-01-01T00:00:00Z',
    saved_verses: ['Proverbs 31:25', 'Luke 1:45', 'Esther 4:14']
  },
  {
    id: 'usr_pastor_easter',
    phone: '0771889900',
    password: 'PastorEaster2026!',
    full_name: 'Pastor Easter',
    handle: '@pastor_easter',
    role: 'super_admin',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    cell_group: 'National Executive Directorate',
    bio: 'National Executive Overseer & Apostolic Administrator. Championing global kingdom governance, discipleship, and church development.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 890,
    following_count: 3,
    member_id: 'GCZ-003-ADMIN',
    created_at: '2020-06-01T00:00:00Z',
    saved_verses: ['1 Corinthians 15:58', 'Colossians 1:28']
  },
  {
    id: 'usr_developer',
    phone: '0780699988',
    password: 'juice2026',
    full_name: 'mr_juice7',
    handle: '@mr_juice7',
    role: 'developer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Gateway Tech Ministry',
    bio: 'Platform Architect & Kingdom Technologist. Engineering scalable cloud solutions for Gateway Connect ecosystem.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 5,
    following_count: 4,
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
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Harare Central Hub',
    bio: 'Harare Central Hub Overseer. Devoted to pastoral counseling, cell multiplication, and fiery intercessory prayer.',
    location: 'Harare Central, Zimbabwe',
    is_verified: true,
    badge_type: 'silver',
    is_premium: true,
    followers_count: 6,
    following_count: 3,
    member_id: 'GCZ-MOD-442',
    created_at: '2022-08-10T00:00:00Z',
    saved_verses: ['Matthew 28:19', 'Acts 2:42']
  },
  {
    id: 'usr_pastor_grace',
    phone: '0775889911',
    password: 'Grace2026!',
    full_name: 'Pastor Grace Daniels',
    handle: '@pastor_grace',
    role: 'moderator',
    avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Women of Honor Fellowship',
    bio: 'Mother in the house, leader in Women of Honor. Raising believers grounded in holiness, grace, and prayer.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 7,
    following_count: 2,
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
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Bulawayo North Cell',
    bio: 'Bulawayo tech entrepreneur & active intercessor. Partnering in the 2026 Cathedral Building Project.',
    location: 'Bulawayo, Zimbabwe',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 3,
    following_count: 4,
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
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Worship & Creative Arts Hub',
    bio: 'Gateway Praise & Worship Lead. Living to worship Jesus in spirit and in truth. Songwriter & psalmist.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 4,
    following_count: 3,
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
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Campus Ignite Hub',
    bio: 'UZ Campus Fellowship President. Igniting young hearts with the fire of the Holy Spirit across universities.',
    location: 'Mount Pleasant, Harare',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 3,
    following_count: 4,
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
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Business & Professionals Network',
    bio: 'Marketplace partner & agribusiness founder in Mashonaland East. Standing on Deuteronomy 8:18.',
    location: 'Marondera, Zimbabwe',
    is_verified: false,
    badge_type: 'none',
    is_premium: true,
    followers_count: 2,
    following_count: 3,
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
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Gateway Media & Broadcast',
    bio: 'Broadcast director. Connecting thousands of diaspora believers to the prophetic altar of Gateway Church.',
    location: 'Harare, Zimbabwe',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 4,
    following_count: 3,
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
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Chitungwiza Community Cell',
    bio: 'Dedicated to serving in the house of the Lord. Believing God for supernatural acceleration in 2026.',
    location: 'Chitungwiza, Zimbabwe',
    is_verified: false,
    badge_type: 'none',
    is_premium: false,
    followers_count: 2,
    following_count: 3,
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
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
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
    id: 'sermon_church_politics',
    title: 'Church & Politics (Controversial Issues)',
    speaker: 'Apostle Joe Daniels',
    date: 'Latest Apostolic Word',
    series: 'Apostolic Word',
    duration: '42m',
    youtube_id: '-CibsaxijIk',
    thumbnail_url: 'https://img.youtube.com/vi/-CibsaxijIk/hqdefault.jpg',
    scriptures: [],
    description: 'Apostle Joe Daniels unpacks controversial issues regarding church, state, and governance with kingdom depth.',
    view_count: 38400,
    is_live: true,
    is_premium: false
  },
  {
    id: 'sermon_1',
    title: '(Bring change from within… Apostle)',
    speaker: 'Apostle Joe Daniels',
    date: 'Recent Apostolic Short',
    series: 'Apostolic Revelations',
    duration: '1m',
    youtube_id: 'upeY03DKvTo',
    thumbnail_url: 'https://img.youtube.com/vi/upeY03DKvTo/hqdefault.jpg',
    scriptures: [],
    description: 'Bring change from within… Powerful apostolic message by Apostle Joe Daniels.',
    view_count: 15400,
    is_live: false,
    is_premium: false
  },
  {
    id: 'sermon_2',
    title: 'God changes your circle before He changes your',
    speaker: 'Apostle Joe Daniels',
    date: 'Recent Apostolic Short',
    series: 'Divine Wisdom',
    duration: '1m',
    youtube_id: 'Im5BmoPwSHI',
    thumbnail_url: 'https://img.youtube.com/vi/Im5BmoPwSHI/hqdefault.jpg',
    scriptures: [],
    description: 'God changes your circle before He changes your life. Walk with those who carry your future.',
    view_count: 18200,
    is_live: false,
    is_premium: false
  },
  {
    id: 'sermon_3',
    title: 'Sei uchirwadziswa kana kuwomerwa iwe...',
    speaker: 'Apostle Joe Daniels',
    date: 'Recent Apostolic Short',
    series: 'ChiShona Teachings',
    duration: '1m',
    youtube_id: 'cSreVpL8-Y4',
    thumbnail_url: 'https://img.youtube.com/vi/cSreVpL8-Y4/hqdefault.jpg',
    scriptures: [],
    description: 'Sei uchirwadziswa kana kuwomerwa iwe... Apostolic counsel by Apostle Joe Daniels.',
    view_count: 14700,
    is_live: false,
    is_premium: false
  },
  {
    id: 'sermon_4',
    title: 'Varume izvi ndizvinoda vakadzi vedu…',
    speaker: 'Apostle Joe Daniels',
    date: 'Recent Apostolic Short',
    series: 'Family & Marriage',
    duration: '1m',
    youtube_id: 'iaHCBW8XDGU',
    thumbnail_url: 'https://img.youtube.com/vi/iaHCBW8XDGU/hqdefault.jpg',
    scriptures: [],
    description: 'Varume izvi ndizvinoda vakadzi vedu… Biblical marital wisdom for couples.',
    view_count: 22100,
    is_live: false,
    is_premium: false
  },
  {
    id: 'sermon_5',
    title: 'Mwari ngaakubvisirewo nhamo inokutadzisa.....',
    speaker: 'Apostle Joe Daniels',
    date: 'Recent Apostolic Short',
    series: 'Deliverance & Freedom',
    duration: '1m',
    youtube_id: '6STJ8Hv4RE8',
    thumbnail_url: 'https://img.youtube.com/vi/6STJ8Hv4RE8/hqdefault.jpg',
    scriptures: [],
    description: 'Mwari ngaakubvisirewo nhamo inokutadzisa..... Deliverance decree breaking ancestral hardship.',
    view_count: 27500,
    is_live: false,
    is_premium: false
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
    id: 'group_ignite_worship',
    name: 'Ignite Worship Team',
    category: 'Worship',
    location: 'Sanctuary & Online',
    leader_name: 'Apostle Joe Daniels & Praise Team',
    leader_phone: '+263 77 144 5642',
    meeting_time: 'Fridays @ 6:00 PM CAT',
    member_count: 8,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'About worship and awakening the consciousness of God, A forum and foundation that connects people together and with God.',
    joined: true
  },
  {
    id: 'group_pride_of_lions',
    name: 'Pride Of Lions',
    category: 'Men',
    location: 'Belvedere Hub & Virtual',
    leader_name: 'Pastor Easter & Men Directorate',
    leader_phone: '+263 77 144 5642',
    meeting_time: 'Saturdays @ 7:00 AM CAT',
    member_count: 8,
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    description: "Men's Worship team & ministry where men are groomed and trained in the way of God and how to be better Husbands and men.",
    joined: false
  },
  {
    id: 'group_passion_ladies',
    name: 'Passion ladies',
    category: 'Women',
    location: 'Gateway Center & Virtual',
    leader_name: 'Prophetess Melinda Daniels',
    leader_phone: '+263 77 144 5642',
    meeting_time: 'Saturdays @ 10:00 AM CAT',
    member_count: 4,
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    description: '(by Prophetess Melinda Daniels) Training ladies to be godly women, wives, mothers, and spiritual leaders walking in dignity, grace, and apostolic purpose.',
    joined: false
  },
  {
    id: 'group_foundation_school',
    name: 'Foundation School',
    category: 'School',
    location: 'Apostolic Academy & Online Portal',
    leader_name: 'Apostle Joe Daniels & Faculty',
    leader_phone: '+263 77 144 5642',
    meeting_time: 'Sundays @ 7:00 AM & Midweek',
    member_count: 8,
    image_url: '/assets/apostle_joe_daniels_grad.jpg',
    description: 'Enroll to learn about Christ, discipleship, spiritual foundation, and how to build yourself and mature in the Kingdom.',
    joined: false
  },
  {
    id: 'group_gymstars_foundation',
    name: 'Gymstars Foundation',
    category: 'Youth',
    location: 'Youth Arena & Harare West',
    leader_name: 'Minister Kuda & Youth Directorate',
    leader_phone: '+263 77 144 5642',
    meeting_time: 'Saturdays @ 2:00 PM CAT',
    member_count: 7,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'Foundation for youth and juniors where we groom and teach the youth to find God at an early age, build character, and excel.',
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
    id: 'evt_sunday',
    title: 'Sunday Glorious Service',
    date: 'Every Sunday',
    time: '08:00 - 13:00 CAT',
    location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
    description: 'Atmospheric praise, explosive apostolic revelations, prophetic ministry, and communion with Apostle Joe Daniels.',
    banner_url: '/assets/apostle_joe_daniels_preach.jpg',
    category: 'Sunday Service',
    speaker: 'Apostle Joe Daniels',
    is_featured: true,
    is_permanent: true,
    ticket_required: false
  },
  {
    id: 'evt_wednesday',
    title: 'Wednesday Midweek Dominion Service',
    date: 'Every Wednesday',
    time: '17:00 - 20:00 CAT',
    location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
    description: 'Deep scriptural study, targeted intercessory warfare, prophetic alignment, and spiritual deliverance.',
    banner_url: '/assets/apostle_joe_daniels_podcast.jpg',
    category: 'Wednesday Service',
    speaker: 'Apostle Joe Daniels',
    is_featured: true,
    is_permanent: true,
    ticket_required: false
  },
  {
    id: 'evt_seminar_custom',
    title: 'Pastors and Leaders Seminar',
    date: '12 Sept 2026',
    time: '1:00pm - 5:00pm CAT',
    location: 'Chitungwiza',
    description: 'Apostolic impartation, church leadership governance, ministerial ethics, and pastoral acceleration.',
    banner_url: '/assets/apostle_joe_daniels_main.jpg',
    category: 'Seminar',
    speaker: 'Apostle Joe Daniels',
    is_featured: false,
    is_permanent: false,
    ticket_required: false
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_jd_white_heaven',
    name: 'JD Collection "Make Heaven Crowded" Velvet Print T-Shirt',
    category: 'Kingdom Apparel',
    price_usd: 34.99,
    price_zig: 518,
    price_zar: 699,
    image_url: '/assets/store/jd_white_heaven.jpg',
    description: 'White Theme: 100% premium soft cotton t-shirt with signature black suede velvet print "MAKE HEAVEN CROWDED" across the chest. Reverse showcases the Apostle Joe Daniels silhouette, QR connection hub, and "SPIRIT. LOVE. GRACE" manifesto.',
    color_theme: 'White (Black Velvet Print)',
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Premium Combed Cotton (Suede Velvet Texture)',
    features: ['Velvet print finish', 'Unisex luxury fit', 'Apostle silhouette back print', 'Worldwide shipping'],
    author_or_brand: 'Joe Daniels Collection',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_jd_orange_child',
    name: 'JD Collection "Child of God" Limited Edition T-Shirt',
    category: 'Kingdom Apparel',
    price_usd: 34.99,
    price_zig: 518,
    price_zar: 699,
    image_url: '/assets/store/jd_orange_child.jpg',
    description: 'Kingdom Orange Theme: Vibrant high-voltage orange luxury tee with bold black "CHILD OF GOD" chest print incorporating the covenant cross inside the H. Back highlights vertical "JOE DANIELS SPIRIT. LOVE. GRACE" with Apostle silhouette.',
    color_theme: 'Kingdom Orange (Black Typography)',
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Soft Combed Cotton',
    features: ['Faith driven message', 'Soft & strong comfort', 'Limited drop series', 'Custom JD hem tag'],
    author_or_brand: 'Joe Daniels Collection',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_jd_green_faith',
    name: 'JD Collection "Step In Faith" 2 Corinthians 5:7 T-Shirt',
    category: 'Kingdom Apparel',
    price_usd: 34.99,
    price_zig: 518,
    price_zar: 699,
    image_url: '/assets/store/jd_green_faith.jpg',
    description: 'Emerald Green Theme: Rich emerald green unisex apparel with yellow and white "STEP IN FAITH" chest graphic, iconic retro sneaker motif, and "2 CORINTHIANS 5:7". Reverse features "THE MORE YOU LEARN, THE MORE YOU EARN" and Dr. Joe Daniels digital portal.',
    color_theme: 'Emerald Green (Yellow & White Graphic)',
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Premium Cotton Heavyweight',
    features: ['Comfort fit', 'Durable high-density screenprint', 'Scripture-infused streetwear', 'Unisex fit'],
    author_or_brand: 'Joe Daniels Collection',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_jd_pink_finished',
    name: 'JD Collection "It Is Finished" John 19:28-30 T-Shirt',
    category: 'Kingdom Apparel',
    price_usd: 34.99,
    price_zig: 518,
    price_zar: 699,
    image_url: '/assets/store/jd_pink_finished.jpg',
    description: 'Hot Pink Theme: High-energy magenta streetwear release featuring distressed vertical Calvary cross and bold "IT IS FINISHED" lettering with John 19:28-30 reference. Back showcases vertical "JOE DANIELS SPIRIT. LOVE. GRACE" and raised-hand silhouette.',
    color_theme: 'Hot Pink / Magenta (Black Grunge Cross)',
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Premium Heavy Cotton Baggy Fit',
    features: ['Spirit driven', 'Love in action', 'Grace for all', 'Baggy streetwear silhouette'],
    author_or_brand: 'Joe Daniels Collection',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_jd_cream_butgod',
    name: 'JD Collection "There Was No Way But God" Baggy T-Shirt',
    category: 'Kingdom Apparel',
    price_usd: 34.99,
    price_zig: 518,
    price_zar: 699,
    image_url: '/assets/store/jd_cream_butgod.jpg',
    description: 'Vanilla Cream Theme: Off-white luxury streetwear silhouette with dark royal blue brush script "but God" and prophetic subtitle "There was no way But God made a way." Reverse exhibits royal blue and black vertical brand graphics and Apostle Joe Daniels silhouette.',
    color_theme: 'Vanilla Cream (Royal Navy Script)',
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Luxury Heavyweight Baggy Cotton',
    features: ['Baggy cut freedom', 'Soft & strong durable weave', 'Minimalist apostolic luxury', 'Limited release drop'],
    author_or_brand: 'Joe Daniels Collection',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_jd_maroon_construction',
    name: 'JD Collection "Christian Under Construction" T-Shirt',
    category: 'Kingdom Apparel',
    price_usd: 34.99,
    price_zig: 518,
    price_zar: 699,
    image_url: '/assets/store/jd_maroon_construction.jpg',
    description: 'Deep Maroon Theme: Deep burgundy apparel with caution hazard stripe badge reading "I AM A CHRISTIAN UNDER CONSTRUCTION - GOD\'S NOT DONE WITH ME YET! ⚠️". Features Dr. Joe Daniels sleeve signature and vertical gold branding on the back.',
    color_theme: 'Deep Maroon Burgundy (Hazard Caution Gold)',
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Combed Heavy Cotton',
    features: ['Sleeve signature print', 'Baggy comfort fit', 'God is not done with me yet message', 'Pre-shrunk fabric'],
    author_or_brand: 'Joe Daniels Collection',
    in_stock: true,
    is_bestseller: true
  },
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
    user_name: 'Tatenda Chirwa',
    user_phone: '+263 77 855 6677',
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 1 },
      { product: MOCK_PRODUCTS[2], quantity: 1, selectedSize: 'L' }
    ],
    total_usd: 43,
    payment_method: 'EcoCash',
    status: 'Processing',
    delivery_address: '14 Samora Machel Ave, Harare CBD',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'ord_902',
    user_name: 'Tinashe Chikwava',
    user_phone: '+263 71 234 5678',
    items: [
      { product: MOCK_PRODUCTS[1], quantity: 2, selectedSize: 'XL' }
    ],
    total_usd: 50,
    payment_method: 'Credit Card',
    status: 'Processing',
    delivery_address: 'Bulawayo Gateway Campus Pickup Desk',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'ord_903',
    user_name: 'Chipo Ruvimbo Mandaza',
    user_phone: '+263 77 433 4455',
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 1 }
    ],
    total_usd: 15,
    payment_method: 'PayPal',
    status: 'Dispatched',
    delivery_address: '7 Rekayi Tangwena Ave, Belvedere Harare',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
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
    id: 'post_church_and_politics',
    user_id: 'usr_apostle_joe',
    user_name: 'Apostle Joe Daniels',
    user_handle: '@apostle_joe_daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Church & Politics (Controversial Issues)',
    category: 'Apostolic Word',
    content: 'Apostle Joe Daniels unpacks controversial issues regarding church, state, and governance with biblical clarity and kingdom depth.',
    youtube_id: '-CibsaxijIk',
    video_url: 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP',
    image_url: 'https://img.youtube.com/vi/-CibsaxijIk/hqdefault.jpg',
    date: 'Just now',
    created_at: new Date().toISOString(),
    liked_user_ids: ['usr_pastor_tendai', 'usr_pastor_grace', 'usr_developer', 'usr_kuda'],
    likes_count: 4,
    verified_by_church: true,
    comments_count: 1,
    comments: [
      {
        id: 'comm_pol_1',
        user_id: 'usr_developer',
        user_name: 'mr_juice7',
        user_handle: '@mr_juice7',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        text: 'Timely wisdom for our generation and beyond. Blessings Apostle! 🙏',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        likes_count: 5,
        badge_type: 'blue'
      }
    ]
  },
  {
    id: 'post_kuroorwa_kutiza_nhamo',
    user_id: 'usr_apostle_joe',
    user_name: 'Apostle Joe Daniels',
    user_handle: '@apostle_joe_daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'KUROORWA KUTIZA NHAMO',
    category: 'Apostolic Teaching',
    content: 'Deep apostolic exposition on foundational life issues and spiritual alignments by Apostle Joe Daniels.',
    youtube_id: 'O81pcXt99Ug',
    video_url: 'https://www.youtube.com/watch?v=O81pcXt99Ug',
    image_url: 'https://img.youtube.com/vi/O81pcXt99Ug/hqdefault.jpg',
    date: '10 mins ago',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_pastor_tendai', 'usr_pastor_grace', 'usr_developer', 'usr_chipo', 'usr_kuda'],
    likes_count: 5,
    verified_by_church: true,
    comments_count: 2,
    comments: [
      {
        id: 'comm_1',
        user_id: 'usr_pastor_tendai',
        user_name: 'Pastor Tendai Moyo',
        user_handle: '@pastor_tendai',
        user_avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        text: 'Amen Apostle! Truth that liberates souls! 🔥🙏',
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        likes_count: 1,
        badge_type: 'silver'
      }
    ]
  },
  {
    id: 'post_demonstrates_power',
    user_id: 'usr_apostle_joe',
    user_name: 'Apostle Dr Joe Daniels',
    user_handle: '@apostle_joe_daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Apostle Dr Joe Daniels demonstrates power…',
    category: 'Deliverance',
    content: 'Supernatural manifestations and demonstration of the Holy Ghost in the main sanctuary.',
    youtube_id: 'QZH5zBXD5Is',
    video_url: 'https://www.youtube.com/watch?v=QZH5zBXD5Is',
    image_url: 'https://img.youtube.com/vi/QZH5zBXD5Is/hqdefault.jpg',
    date: '20 minutes ago',
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_pastor_tendai', 'usr_developer', 'usr_tinashe', 'usr_chipo'],
    likes_count: 4,
    verified_by_church: true,
    comments_count: 1,
    comments: [
      {
        id: 'comm_2',
        user_id: 'usr_chipo',
        user_name: 'Chipo Ruvimbo Mandaza',
        user_handle: '@chipo_mandaza',
        user_avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
        text: 'The power of God was palpable in the auditorium! 🙌⚡',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        likes_count: 1,
        badge_type: 'blue'
      }
    ]
  },
  {
    id: 'post_developer_announcement',
    user_id: 'usr_developer',
    user_name: 'mr_juice7',
    user_handle: '@mr_juice7',
    user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    title: 'Gateway Connect Global Architecture Update 2026',
    category: 'Ministry Advancement',
    content: 'Grace and peace saints! Gateway Connect is active with offline sermon downloads, low-data streaming for Econet & NetOne, and integrated EcoCash, Card, and PayPal store orders. Blessed to build for the Kingdom!',
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    date: '2 hrs ago',
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    liked_user_ids: ['usr_apostle_joe', 'usr_pastor_tendai', 'usr_pastor_grace', 'usr_kuda'],
    likes_count: 4,
    verified_by_church: true,
    comments_count: 1,
    comments: [
      {
        id: 'comm_dev_1',
        user_id: 'usr_apostle_joe',
        user_name: 'Apostle Joe Daniels',
        user_handle: '@apostle_joe_daniels',
        user_avatar: '/assets/apostle_joe_daniels_main.jpg',
        text: 'Excellent work my son! The gospel is advancing into every territory through technology. Blessings! 🙌🔥',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        likes_count: 3,
        badge_type: 'gold'
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

export const INITIAL_CHAT_GROUPS: ChatGroup[] = [
  {
    id: 'group_ignite_worship',
    name: 'Ignite Worship Team',
    description: 'About worship and awakening the consciousness of God, A forum and foundation that connects people together and with God',
    category: 'Worship',
    is_paid: false,
    invite_code: 'ignite-worship-2026',
    created_by: 'usr_apostle_joe',
    creator_name: 'Apostle Joe Daniels',
    admin_ids: ['usr_apostle_joe', 'usr_developer'],
    avatar_url: '/assets/apostle_joe_daniels_preach.jpg',
    created_at: '2026-01-10T00:00:00Z',
    member_ids: ['usr_apostle_joe', 'usr_prophetess_melinda', 'usr_pastor_grace', 'usr_chipo', 'usr_tinashe', 'usr_tatenda', 'usr_nyasha', 'usr_farai'],
    pinned_notice: 'Worship rehearsals and atmospheric prayer every Thursday at 6:00 PM.'
  },
  {
    id: 'group_pride_of_lions',
    name: 'Pride Of Lions',
    description: "Men's Worship team & ministry where men are groomed and trained in the way of God and how to be better Husbands and men",
    category: 'Men',
    is_paid: false,
    invite_code: 'pride-lions-2026',
    created_by: 'usr_apostle_joe',
    creator_name: 'Apostle Joe Daniels',
    admin_ids: ['usr_apostle_joe', 'usr_pastor_easter', 'usr_developer'],
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    created_at: '2026-01-15T00:00:00Z',
    member_ids: ['usr_apostle_joe', 'usr_pastor_easter', 'usr_pastor_tendai', 'usr_developer', 'usr_tinashe', 'usr_tatenda', 'usr_kuda', 'usr_farai'],
    pinned_notice: 'Iron sharpens iron. Monthly brotherhood prayer & leadership symposium.'
  },
  {
    id: 'group_passion_ladies',
    name: 'Passion ladies',
    description: '(by Prophetess Melinda Daniels) Training ladies to be godly women, wives, mothers, and spiritual leaders walking in dignity, grace, and apostolic purpose.',
    category: 'Women',
    is_paid: false,
    invite_code: 'passion-ladies-2026',
    created_by: 'usr_prophetess_melinda',
    creator_name: 'Prophetess Melinda Daniels',
    admin_ids: ['usr_prophetess_melinda', 'usr_apostle_joe', 'usr_developer'],
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    created_at: '2026-02-01T00:00:00Z',
    member_ids: ['usr_prophetess_melinda', 'usr_pastor_grace', 'usr_chipo', 'usr_nyasha'],
    pinned_notice: 'Welcome Daughters of Zion! Grace and honor are your portion.'
  },
  {
    id: 'group_foundation_school',
    name: 'Foundation School',
    description: 'Enroll to learn about Christ, discipleship, spiritual foundation, and how to build yourself and mature in the Kingdom.',
    category: 'School',
    is_paid: true,
    price_usd: 150,
    duration_months: 3,
    invite_code: 'foundation-school-2026',
    created_by: 'usr_apostle_joe',
    creator_name: 'Apostle Joe Daniels',
    admin_ids: ['usr_apostle_joe', 'usr_developer'],
    avatar_url: '/assets/apostle_joe_daniels_grad.jpg',
    created_at: '2026-02-10T00:00:00Z',
    member_ids: ['usr_apostle_joe', 'usr_prophetess_melinda', 'usr_pastor_easter', 'usr_developer', 'usr_pastor_tendai', 'usr_chipo', 'usr_tinashe', 'usr_kuda'],
    pinned_notice: 'Apostolic curriculum term enrolled. Term duration: 3 months ($150 membership).'
  },
  {
    id: 'group_gymstars_foundation',
    name: 'Gymstars Foundation',
    description: 'Foundation for youth and juniors where we groom and teach the youth to find God at an early age, build character, and excel.',
    category: 'Youth',
    is_paid: false,
    invite_code: 'gymstars-youth-2026',
    created_by: 'usr_apostle_joe',
    creator_name: 'Apostle Joe Daniels',
    admin_ids: ['usr_apostle_joe', 'usr_developer'],
    avatar_url: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=200&auto=format&fit=crop&q=80',
    created_at: '2026-02-15T00:00:00Z',
    member_ids: ['usr_apostle_joe', 'usr_kuda', 'usr_tinashe', 'usr_nyasha', 'usr_tatenda', 'usr_farai', 'usr_chipo'],
    pinned_notice: 'Raising a generation without compromise! Junior fellowship every Saturday morning.'
  }
];

export const INITIAL_CHAT_GROUP_MESSAGES: Record<string, ChatGroupMessage[]> = {
  group_ignite_worship: [
    {
      id: 'msg_worship_1',
      group_id: 'group_ignite_worship',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'super_admin',
      text: 'Grace and fire to the Ignite Worship Team! Let our worship continuously awaken the consciousness of God across the nations. 🔥🕊️',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'msg_worship_2',
      group_id: 'group_ignite_worship',
      sender_id: 'usr_chipo',
      sender_name: 'Chipo Ruvimbo Mandaza',
      sender_role: 'member',
      text: 'Amen Apostle! The atmosphere for Sunday broadcast is charged. Rehearsals begin at 5:00 PM today.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  group_pride_of_lions: [
    {
      id: 'msg_lions_1',
      group_id: 'group_pride_of_lions',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'super_admin',
      text: 'Welcome to Pride Of Lions men. A man who fears the Lord is a pillar of strength, honor, and priesthood in his home and church.',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'msg_lions_2',
      group_id: 'group_pride_of_lions',
      sender_id: 'usr_pastor_easter',
      sender_name: 'Pastor Easter',
      sender_role: 'super_admin',
      text: 'Amen! God is raising godly husbands and builders of kingdom wealth in this generation.',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ],
  group_passion_ladies: [
    {
      id: 'msg_passion_1',
      group_id: 'group_passion_ladies',
      sender_id: 'usr_prophetess_melinda',
      sender_name: 'Prophetess Melinda Daniels',
      sender_role: 'super_admin',
      text: 'Welcome precious daughters of Zion to Passion Ladies! Here we are groomed in purity, wisdom, prayer, and being noble wives and leaders. 👑💖',
      created_at: new Date(Date.now() - 3600000 * 10).toISOString()
    },
    {
      id: 'msg_passion_2',
      group_id: 'group_passion_ladies',
      sender_id: 'usr_pastor_grace',
      sender_name: 'Pastor Grace Daniels',
      sender_role: 'moderator',
      text: 'Hallelujah Mama Melinda! So grateful for this divine sisterhood.',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ],
  group_foundation_school: [
    {
      id: 'msg_fs_1',
      group_id: 'group_foundation_school',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'super_admin',
      text: 'Welcome to Foundation School. In this 3-month apostolic curriculum, you are established on the unshakeable rock of Christ doctrine and kingdom authority.',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'msg_fs_2',
      group_id: 'group_foundation_school',
      sender_id: 'usr_developer',
      sender_name: 'mr_juice7',
      sender_role: 'developer',
      text: 'Course modules and curriculum syllabus are loaded into the portal. Let us dive deep into the Word!',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ],
  group_gymstars_foundation: [
    {
      id: 'msg_gym_1',
      group_id: 'group_gymstars_foundation',
      sender_id: 'usr_apostle_joe',
      sender_name: 'Apostle Joe Daniels',
      sender_role: 'super_admin',
      text: 'Remember now thy Creator in the days of thy youth! Gymstars, let your light shine boldly in school and community. 🌟',
      created_at: new Date(Date.now() - 3600000 * 7).toISOString()
    }
  ]
};
