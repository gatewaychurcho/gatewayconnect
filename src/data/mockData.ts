import type {
  ChatGroup,
  ChatGroupMessage,
  ChurchEvent,
  CommunityGroup,
  Devotional,
  Donation,
  JoeVibesSubmission,
  Order,
  PrayerRequest,
  PremiumPlan,
  Product,
  PushNotification,
  Sermon,
  ServiceBooking,
  Testimony,
  User
} from '../types';

export const LEGACY_DEMO_USER_IDS = new Set([
  'usr_guest',
  'usr_1789070673850',
  'usr_1789211957505',
  'usr_1789219818339',
  'usr_1789633236396',
  'usr_1789636133491',
  'usr_1789637217778',
  'usr_1789724364288',
  'usr_1789725338167',
  'usr_1789392285476',
  'usr_1789417343773',
  'usr_1789427856999',
  'usr_1789430487066',
  'usr_1789501487042',
  'usr_1789647677514',
  'usr_1789921675992',
  '8392aeb9-51dd-4bd4-b575-3e4b6b790c7d',
  'd55cbd47-7d57-4c88-a29e-830e9b923bf6',
  'c209ff71-05d4-4fb4-91db-9bcfe9ed1ec8',
  '26f6b0c6-6f10-4298-9dc5-19439233467e',
  '2e3c059c-0d3e-4a59-ac66-ee3aa8f86d16',
  '3de57047-4159-4969-b467-497914501273',
  'cf3c1605-58b6-4748-98b8-3167fa8a8513',
  'df23d85b-8701-47c9-a5bb-53c024098e8a',
  '3c73fbca-373f-48d3-b999-10efefc8f961',
  '3baf2bb6-d89a-4b1e-90ce-8a68b7c3fbd2',
  '08711189-32dd-4d9d-abb1-ace8904113a2',
  'usr_1789425418840',
  'usr_rutendo_ndlovu',
  'usr_simba_hove',
  'usr_tariro_mutasa',
  'usr_blessings_sibanda',
  'usr_anesu_sithole',
  'usr_privilege_makoni',
  'usr_tapiwa_muzenda',
  'usr_nokuthula_moyo',
  'usr_rumbidzai_marufu',
  'usr_munyaradzi_chigumba',
  'usr_gamuchirai_kaseke',
  'usr_takudzwa_dube',
  'usr_fadzai_mashingaidze',
  'usr_panashe_nyoni',
  'usr_vimbai_zhou',
  'usr_knowledge_matarise',
  'usr_chengetai_shumba',
  'usr_shalom_chimedza',
  'usr_tendekai_mupfumi',
  'usr_tsitsi_gava',
  'usr_mthokozisi_nkomo',
  'usr_praise_magaya'
]);

export const LEGACY_DEMO_GROUP_IDS = new Set([
  'group_ignite_worship',
  'group_pride_of_lions',
  'group_passion_ladies',
  'group_foundation_school',
  'group_gymstars_foundation',
  'group_international_school_of_mentorship'
]);

export const INITIAL_USERS: User[] = [
  {
    id: "usr_developer",
    phone: "0780699988",
    password: "juice2026",
    full_name: "mr_juice7",
    handle: "@mr_juice7",
    role: "developer",
    is_verified: true,
    badge_type: "gold",
    is_premium: true,
    followers_count: 41,
    following_count: 4,
    cell_group: "Gateway Tech Ministry",
    bio: "Platform Architect & Kingdom Technologist. Engineering scalable cloud solutions for Gateway Connect ecosystem.",
    location: "Harare, Zimbabwe",
    member_id: "GCZ-DEV-001",
    created_at: "2023-05-15T00:00:00Z",
    saved_verses: [
      "Psalms 23:1",
      "Proverbs 3:5"
    ],
    city_location: "Harare, Zimbabwe",
    website: "mrjuice.vercel.app"
  },
  {
    id: "usr_howard",
    phone: "0784667632",
    password: "juice2026",
    full_name: "Howard",
    handle: "@howard",
    role: "developer",
    is_verified: true,
    badge_type: "gold",
    is_premium: true,
    followers_count: 25,
    following_count: 3,
    cell_group: "Gateway Tech Ministry",
    bio: "Core Developer & Platform Administrator for Gateway Connect ecosystem.",
    location: "Harare, Zimbabwe",
    member_id: "GCZ-DEV-002",
    created_at: "2024-01-01T00:00:00Z",
    saved_verses: [
      "Psalms 23:1",
      "Proverbs 3:5"
    ],
    city_location: "Harare, Zimbabwe"
  },
  {
    id: "usr_apostle_joe",
    phone: "0772123456",
    password: "Apostle2026!",
    full_name: "Apostle Joe Daniels",
    handle: "@joedaniels",
    role: "super_admin",
    is_verified: true,
    badge_type: "gold",
    is_premium: true,
    followers_count: 41,
    following_count: 4,
    avatar_url: "/assets/apostle_joe_daniels_main.jpg",
    cell_group: "Apostolic Directorate",
    bio: "Founder & General Overseer of Gateway Church. Mandated with Supernatural Acceleration, Kingdom Covenant & Apostolic Authority in Zimbabwe & across the nations.",
    location: "Harare, Zimbabwe",
    member_id: "GCZ-001-FOUNDER",
    created_at: "2020-01-01T00:00:00Z",
    saved_verses: [
      "John 1:1",
      "Romans 8:28",
      "Isaiah 40:31",
      "1 Kings 18:46"
    ],
    baptism_date: "1998-04-12",
    offline_sermon_ids: [
      "sermon_1",
      "sermon_2"
    ],
    is_banned: false,
    city_location: "Harare",
    website: "joedaniels.org"
  },
  {
    id: "usr_prophetess_melinda",
    phone: "0775112233",
    password: "Prophetess2026!",
    full_name: "Prophetess Melinda Daniels",
    handle: "@prophetess_melinda",
    role: "super_admin",
    is_verified: true,
    badge_type: "gold",
    is_premium: true,
    followers_count: 38,
    following_count: 4,
    avatar_url: "/assets/avatar_pastor_grace_1790322830880.jpg",
    cell_group: "Apostolic Directorate",
    bio: "Co-Founder of Gateway Church. Raising an altar of continuous worship, prophetic revelation, and supernatural breakthrough across the nations.",
    location: "Harare, Zimbabwe",
    member_id: "GCZ-002-FOUNDER",
    created_at: "2020-01-01T00:00:00Z",
    saved_verses: [
      "Psalms 91:1-2",
      "Proverbs 31:10",
      "Jeremiah 29:11"
    ],
    baptism_date: "2000-05-18",
    is_banned: false,
    city_location: "Harare"
  },
  {
    id: "usr_pastor_easter",
    phone: "0771889900",
    password: "PastorEaster2026!",
    full_name: "Pastor Easter Daniels",
    handle: "@pastor_easter",
    role: "super_admin",
    is_verified: true,
    badge_type: "gold",
    is_premium: true,
    followers_count: 32,
    following_count: 4,
    avatar_url: "/assets/avatar_worship_youth_1790322812538.jpg",
    cell_group: "Executive Directorate",
    bio: "Executive Pastor & Senior Administrator. Overseeing church operations, discipleship curricula, and ministerial stewardship across all Gateway assemblies.",
    location: "Harare, Zimbabwe",
    member_id: "GCZ-003-EXEC",
    created_at: "2020-01-01T00:00:00Z",
    saved_verses: [
      "Colossians 3:23",
      "1 Timothy 4:12"
    ],
    baptism_date: "2005-08-20",
    is_banned: false,
    city_location: "Harare"
  },
  {
    id: "usr_pastor_tendai",
    phone: "0773998877",
    password: "Pastor2026!",
    full_name: "Pastor Tendai Mutasa",
    handle: "@pastor_tendai",
    role: "pastor",
    is_verified: true,
    badge_type: "silver",
    is_premium: true,
    followers_count: 15,
    following_count: 3,
    avatar_url: "/assets/apostle_joe_daniels_preach.jpg",
    cell_group: "Harare Central Hub",
    bio: "Harare Central Hub Overseer. Devoted to pastoral counseling, cell multiplication, and fiery intercessory prayer.",
    location: "Harare Central, Zimbabwe",
    member_id: "GCZ-MOD-442",
    created_at: "2022-08-10T00:00:00Z",
    saved_verses: [
      "Matthew 28:19",
      "Acts 2:42"
    ],
    is_banned: false,
    city_location: "Harare"
  },
  {
    id: "usr_pastor_grace",
    phone: "0775889911",
    password: "Gateway2026!",
    full_name: "Pastor Grace Chiweshe",
    handle: "@pastor_grace",
    role: "pastor",
    is_verified: true,
    badge_type: "silver",
    is_premium: false,
    followers_count: 12,
    following_count: 4,
    avatar_url: "/assets/avatar_church_elder_1790322822242.jpg",
    cell_group: "Women of Honor Fellowship",
    bio: "Mother in the house, leader in Women of Honor. Raising believers grounded in holiness, grace, and prayer.",
    location: "Harare, Zimbabwe",
    member_id: "GCZ-MOD-002",
    created_at: "2022-10-04T13:50:56Z",
    saved_verses: [
      "Proverbs 31:25",
      "Luke 1:45"
    ],
    city_location: "Harare",
    is_banned: false
  },
  {
    id: "usr_tinashe",
    phone: "0712345678",
    password: "Member2026!",
    full_name: "Tinashe Mugwagwa",
    handle: "@tinashe_m",
    role: "member",
    is_verified: false,
    badge_type: "none",
    is_premium: true,
    followers_count: 5,
    following_count: 2,
    avatar_url: "/assets/avatar_worship_youth_1790322812538.jpg",
    cell_group: "Bulawayo North Cell",
    bio: "Bulawayo tech entrepreneur & active intercessor. Partnering in the 2026 Cathedral Building Project.",
    location: "Bulawayo, Zimbabwe",
    member_id: "GCZ-MEM-8921",
    created_at: "2023-01-14T00:00:00Z",
    saved_verses: [
      "Psalms 91:1",
      "Philippians 4:13"
    ],
    is_banned: false
  }
];
export const MOCK_SERMONS: Sermon[] = [];
export const MOCK_DEVOTIONALS: Devotional[] = [];
export const MOCK_COMMUNITY_GROUPS: CommunityGroup[] = [];
export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [];
export const MOCK_EVENTS: ChurchEvent[] = [];
export const MOCK_PRODUCTS: Product[] = [];
export const MOCK_DONATIONS: Donation[] = [];
export const MOCK_BOOKINGS: ServiceBooking[] = [];
export const MOCK_ORDERS: Order[] = [];
export const MOCK_JOE_VIBES: JoeVibesSubmission[] = [];
export const MOCK_PUSH_NOTIFICATIONS: PushNotification[] = [];
export const MOCK_TESTIMONIES: Testimony[] = [];
export const DEFAULT_PREMIUM_PLANS: PremiumPlan[] = [];
export const INITIAL_CHAT_GROUPS: ChatGroup[] = [];
export const INITIAL_CHAT_GROUP_MESSAGES: Record<string, ChatGroupMessage[]> = {};
export const MOCK_PARTNER_TICKERS: string[] = [];
