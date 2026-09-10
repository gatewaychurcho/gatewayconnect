export type TabType = 'home' | 'bible' | 'community' | 'store' | 'me';
export type UserRole = 'guest' | 'member' | 'moderator' | 'admin' | 'super_admin' | 'developer' | 'pastor' | 'elder' | 'youth';
export type BadgeType = 'gold' | 'silver' | 'blue' | 'none';

export interface User {
  id: string;
  phone: string;
  full_name: string;
  handle?: string;
  role: UserRole;
  password?: string;
  referral_code?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  city_location?: string;
  cell_group?: string;
  is_verified: boolean;
  badge_type?: BadgeType;
  verified_badge?: BadgeType;
  is_premium?: boolean;
  premium_expires_at?: string;
  unlocked_sermon_ids?: string[];
  member_id: string;
  baptism_date?: string;
  created_at: string;
  saved_verses?: string[];
  offline_sermon_ids?: string[];
  followers_count?: number;
  following_count?: number;
  is_banned?: boolean;
  ban_reason?: string;
}

export interface PostComment {
  id: string;
  user_id: string;
  user_name: string;
  user_handle?: string;
  user_avatar?: string;
  text: string;
  created_at: string;
  likes_count?: number;
  liked_user_ids?: string[];
  badge_type?: BadgeType;
}

export interface Testimony {
  id: string;
  user_id?: string;
  user_name: string;
  user_handle?: string;
  user_avatar?: string;
  title: string;
  category: 'Healing' | 'Financial Breakthrough' | 'Spiritual Growth' | 'Deliverance' | 'Family' | 'Praise & Testimony' | 'Joe Vibes' | 'Prophetic Word' | 'Youth & Campus' | 'Kingdom Impact' | 'Pastoral Care' | 'Ministry Advancement' | 'Church & Politics' | 'Apostolic Teaching' | 'Apostolic Word';
  content: string;
  image_url?: string;
  video_url?: string;
  youtube_id?: string;
  scripture_tag?: string;
  date: string;
  created_at?: string;
  likes_count: number;
  liked_user_ids?: string[];
  verified_by_church: boolean;
  user_liked?: boolean;
  comments_count?: number;
  comments?: PostComment[];
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  series: string;
  duration: string;
  youtube_id: string;
  video_url?: string;
  audio_url?: string;
  thumbnail_url: string;
  scriptures: string[];
  description: string;
  view_count: number;
  is_live?: boolean;
  notes?: string;
  is_premium?: boolean;
  snippet_duration?: string;
  unlock_price_usd?: number;
}

export interface PremiumPlan {
  id: string;
  durationMonths: number;
  title: string;
  priceUsd: number;
  priceZig: number;
  popular?: boolean;
  savings?: string;
}

export interface Devotional {
  id: string;
  date: string;
  title: string;
  scripture_verse: string;
  scripture_reference: string;
  content: string;
  prayer: string;
  declaration: string;
  audio_duration?: string;
  author: string;
}

export type BibleVersion = 'KJV' | 'NKJV' | 'NIV' | 'ESV' | 'AMP';

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: BibleVersion;
  highlight?: 'gold' | 'emerald' | 'blue' | 'rose' | null;
  note?: string;
}

export interface BibleBook {
  name: string;
  testament: 'OT' | 'NT';
  chaptersCount: number;
  category: 'Law' | 'History' | 'Poetry' | 'Prophets' | 'Gospels' | 'Epistles' | 'Prophecy';
  abbreviation?: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  daysTotal: number;
  currentDay: number;
  description: string;
  todaysReading: string;
  category: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  category: 'Location' | 'Youth' | 'Business' | 'Women' | 'Men' | 'Diaspora' | 'Worship' | 'School' | 'General';
  location: string;
  leader_name: string;
  leader_phone: string;
  meeting_time: string;
  member_count: number;
  image_url: string;
  description: string;
  joined?: boolean;
}

export interface PrayerRequest {
  id: string;
  user_id?: string;
  user_name: string;
  is_anonymous: boolean;
  category: 'Healing' | 'Financial Breakthrough' | 'Family & Marriage' | 'Deliverance' | 'Spiritual Growth' | 'Business/Career';
  request_text: string;
  is_answered: boolean;
  answered_testimony?: string;
  prayer_count: number;
  user_prayed?: boolean;
  created_at: string;
  apostle_notes?: string;
  is_public: boolean;
  status: 'pending' | 'approved' | 'apostle_prayed';
}

export interface ChurchEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  banner_url: string;
  rsvp_count?: number;
  user_rsvpd?: boolean;
  category: 'Crusade' | 'Sunday Service' | 'Wednesday Service' | 'Conference' | 'Seminar' | 'Youth Ignite' | 'All-Night Prayer' | string;
  speaker: string;
  is_featured?: boolean;
  is_permanent?: boolean;
  target_datetime?: string;
  virtual_notified?: boolean;
  ticket_required?: boolean;
  ticket_price_usd?: number;
  directions_requested?: boolean;
}

export interface PastorLocationRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_location: string;
  user_phone: string;
  user_email?: string;
  event_id: string;
  event_title: string;
  event_time: string;
  destination: string;
  created_at: string;
  status: 'pending' | 'directions_sent';
}

export interface NotificationSettings {
  liveStreams: boolean;
  prayerRequests: boolean;
  directMessages: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: 'Books' | 'Kingdom Apparel' | 'Conference Passes' | 'Anointing Oil & Media';
  price_usd: number;
  price_zig: number;
  price_zar?: number;
  image_url: string;
  description: string;
  author_or_brand?: string;
  in_stock: boolean;
  stock_quantity?: number;
  is_bestseller?: boolean;
  color_theme?: string;
  available_sizes?: string[];
  features?: string[];
  fabric?: string;
}

export interface Receipt {
  id: string;
  reference: string;
  date: string;
  payer_name: string;
  payer_email?: string;
  payer_phone?: string;
  amount: number;
  currency: 'USD' | 'ZiG' | 'GBP' | 'ZAR';
  purpose: string; // e.g. Tithe, Altar Seed, Kingdom Store Order, Conference Pass
  payment_method: string;
  status: 'Paid' | 'Failed';
  created_at: string;
  items_summary?: string;
  paynow_reference?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export type DonationFund = 'Tithe' | 'Firstfruits' | 'Seed Faith' | 'Building Foundation' | 'Missions & Evangelism' | 'Apostolic Honorarium' | 'Altar Seed';
export type PaymentGateway = 'EcoCash' | 'EcoCash Push' | 'Credit Card' | 'PayPal' | 'OneMoney' | 'Paynow' | 'Stripe' | 'Bank Transfer';

export interface UnbanAppeal {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PasswordResetRequest {
  id: string;
  phone: string;
  user_name?: string;
  note: string;
  created_at: string;
  status: 'pending' | 'resolved';
}

export interface Donation {
  id: string;
  donor_id?: string;
  donor_name: string;
  amount: number;
  currency: 'USD' | 'ZiG' | 'ZAR' | 'GBP';
  fund_type: DonationFund;
  category?: string;
  method?: string;
  phone?: string;
  notes?: string;
  payment_method: PaymentGateway;
  status: 'completed' | 'pending' | 'failed';
  receipt_number: string;
  created_at: string;
  impact_tag: string;
  is_anonymous: boolean;
}

export interface ServiceBooking {
  id: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  service_type: 'Prophetic Mentorship' | 'Pastoral Counseling' | 'Business & Estate Dedication' | 'Premarital Guidance' | 'Deliverance & Healing';
  date: string;
  time_slot: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  deposit_amount: number;
  deposit_paid: boolean;
  zoom_link: string;
  notes?: string;
  reminder_phone: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_name: string;
  user_phone: string;
  items: CartItem[];
  total_usd: number;
  payment_method: PaymentGateway;
  status: 'Pending' | 'Processing' | 'Dispatched' | 'Delivered';
  delivery_address: string;
  created_at: string;
}

export interface JoeVibesSubmission {
  id: string;
  artist_name: string;
  song_title: string;
  genre: 'Afro-Gospel' | 'Worship' | 'Praise' | 'Spoken Word' | 'Rap Gospel';
  audio_url: string;
  contact_phone: string;
  status: 'submitted' | 'reviewed' | 'approved' | 'featured';
  submitted_at: string;
  notes?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  target_segment: 'All Members' | 'Harare Province' | 'Diaspora Network' | 'Youth OnFire' | 'Ministry Partners';
  sent_at: string;
  read_count: number;
}

export interface PaynowConfig {
  integrationId: string;
  integrationKey: string;
  isLive: boolean;
  merchantEmail?: string;
  isConfigured: boolean;
}

export interface CommunityStory {
  id: string;
  user_id: string;
  user_name: string;
  user_handle: string;
  user_avatar: string;
  avatar_url?: string;
  badge_type?: BadgeType;
  image_url: string;
  text?: string;
  caption?: string;
  scripture?: string;
  created_at: string; // ISO string for calculating 24h expiration
}

export interface MessageReaction {
  user_id: string;
  user_name?: string;
  emoji: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
  reply_to?: {
    id: string;
    sender_name: string;
    text: string;
  };
  deleted_for_everyone?: boolean;
  deleted_for_users?: string[];
  reactions?: MessageReaction[];
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
}

export const SUPPORTED_CITIES = [
  'Harare',
  'Bulawayo',
  'Chitungwiza',
  'Mutare',
  'Gweru',
  'Kwekwe',
  'Kadoma',
  'Masvingo',
  'Marondera',
  'Hwange',
  'Other In Zimbabwe',
  'Out Of Zimbabwe'
] as const;

export type SupportedCity = typeof SUPPORTED_CITIES[number];

export interface CountryCodeItem {
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCodeItem[] = [
  { name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼' },
  { name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Botswana', dialCode: '+267', flag: '🇧🇼' },
  { name: 'Zambia', dialCode: '+260', flag: '🇿🇲' },
  { name: 'Namibia', dialCode: '+264', flag: '🇳🇦' },
  { name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Other / Global', dialCode: '+', flag: '🌍' },
];

export interface LiveStreamViewer {
  user_id: string;
  full_name: string;
  user_name?: string;
  phone?: string;
  handle?: string;
  city: SupportedCity | string;
  avatar_url?: string;
  device?: string;
  login_details?: string;
  is_active?: boolean;
  joined_at: string;
}

export type StreamViewer = LiveStreamViewer;

export interface StreamAttendanceRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_handle: string;
  city: string;
  session_title: string;
  joined_at: string;
  ended_at?: string;
  status: 'active' | 'completed';
}

export interface AppNotification {
  id: string;
  recipient_id?: string; // Target believer account for WhatsApp-style private notifications
  type: 'follow' | 'chat' | 'like' | 'reply' | 'broadcast';
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  title: string;
  message: string;
  target_id?: string;
  target_type?: 'live' | 'dm' | 'group' | 'testimony' | 'prayer' | 'event' | 'store' | 'url';
  redirect_url?: string;
  link_tab?: string;
  meta_id?: string;
  created_at: string;
  is_read: boolean;
}

export interface CongregationUnit {
  city: string;
  active_streamers: number;
  total_members: number;
  is_congregation: boolean; // True if >= 10 members/streamers
  leader_name?: string;
  streamers: LiveStreamViewer[];
}

export interface DmThread {
  other_user: User;
  last_message: DirectMessage;
  unread_count: number;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  created_by: string; // user id
  creator_name: string;
  admin_ids?: string[]; // group administrators
  only_admins_can_send_messages?: boolean;
  only_admins_can_add_members?: boolean;
  is_paid?: boolean;
  price_usd?: number;
  duration_months?: number; // e.g. 3 months for Foundation School
  category?: 'Worship' | 'Men' | 'Women' | 'Youth' | 'School' | 'General';
  invite_code: string;
  created_at: string;
  member_ids: string[];
  removed_user_ids?: string[]; // Users removed by admin who cannot rejoin with invite code
  pending_invites?: string[];
  pinned_notice?: string;
  pinned_by_users?: string[];
  archived_by_users?: string[];
}

export interface ChatGroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role?: UserRole;
  text: string;
  created_at: string;
  is_system?: boolean;
  reply_to?: {
    id: string;
    sender_name: string;
    text: string;
  };
  tagged_user_ids?: string[];
  read_by_user_ids?: string[];
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document';
  deleted_for_everyone?: boolean;
  deleted_for_users?: string[]; // User IDs who deleted this message for themselves
  reactions?: MessageReaction[];
}

export interface GroupMembership {
  user_id: string;
  group_id: string;
  joined_at: string;
  left_at?: string;
  expires_at?: string; // for paid groups like Foundation School (90 days / 3 months)
  status: 'active' | 'expiring_soon' | 'expired';
  paid_amount?: number;
}

export interface GroupInvite {
  id: string;
  group_id: string;
  group_name: string;
  invited_user_id: string; // Super Admin or Developer
  invited_by_id: string;
  invited_by_name: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
}

export type StreamPlatform = 'youtube' | 'facebook' | 'direct' | 'custom_embed';

export interface StreamEmbedInfo {
  platform: StreamPlatform;
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
  isFacebook: boolean;
  isYoutube: boolean;
  facebookDirectUrl?: string;
  hasNumericVideoId?: boolean;
  isLivePageHub?: boolean;
}

export interface BibleDictionaryEntry {
  term: string;
  definition: string;
  originalLanguage: string; // Hebrew / Greek
  strongsNumber?: string;
  significance: string;
  keyScriptures: string[];
}

export interface BibleInterpreterExegesis {
  reference: string;
  historicalContext: string;
  spiritualMeaning: string;
  apostolicRevelation: string;
  actionStep: string;
}

export interface GroupMediaItem {
  id: string;
  group_id: string;
  message_id?: string;
  user_id: string;
  user_name?: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  created_at: string;
}


