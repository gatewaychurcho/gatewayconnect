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
  'usr_apostle_joe',
  'usr_prophetess_melinda',
  'usr_pastor_easter',
  'usr_developer',
  'usr_pastor_tendai',
  'usr_pastor_grace',
  'usr_tinashe',
  'usr_chipo',
  'usr_kuda',
  'usr_tatenda',
  'usr_nyasha',
  'usr_farai',
  'usr_1789657530055',
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

export const INITIAL_USERS: User[] = [];
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
