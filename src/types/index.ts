export type TabType = 'home' | 'bible' | 'community' | 'store' | 'me';
export type UserRole = 'guest' | 'member' | 'moderator' | 'admin' | 'super_admin' | 'developer';
export type BadgeType = 'gold' | 'silver' | 'blue' | 'none';

export interface User {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  referral_code?: string;
  avatar_url?: string;
  cell_group?: string;
  is_verified: boolean;
  badge_type?: BadgeType;
  is_premium?: boolean;
  premium_expires_at?: string;
  unlocked_sermon_ids?: string[];
  member_id: string;
  baptism_date?: string;
  created_at: string;
  saved_verses?: string[];
  offline_sermon_ids?: string[];
}

export interface Testimony {
  id: string;
  user_name: string;
  user_avatar?: string;
  title: string;
  category: 'Healing' | 'Financial Breakthrough' | 'Spiritual Growth' | 'Deliverance' | 'Family' | 'Praise & Testimony' | 'Joe Vibes' | 'Prophetic Word' | 'Youth & Campus' | 'Kingdom Impact' | 'Pastoral Care' | 'Ministry Milestone';
  content: string;
  image_url?: string;
  scripture_tag?: string;
  date: string;
  likes_count: number;
  verified_by_church: boolean;
  user_liked?: boolean;
  comments_count?: number;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  series: string;
  duration: string;
  youtube_id: string;
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

export type BibleVersion = 'KJV' | 'NIV' | 'ESV' | 'Shona' | 'NWT';

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
  category: 'Location' | 'Youth' | 'Business' | 'Women' | 'Men' | 'Diaspora';
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
  rsvp_count: number;
  user_rsvpd?: boolean;
  category: 'Crusade' | 'Sunday Service' | 'Conference' | 'Youth Ignite' | 'All-Night Prayer';
  speaker: string;
  is_featured?: boolean;
  ticket_required?: boolean;
  ticket_price_usd?: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'Books' | 'Kingdom Apparel' | 'Conference Passes' | 'Anointing Oil & Media';
  price_usd: number;
  price_zig: number;
  image_url: string;
  description: string;
  author_or_brand?: string;
  in_stock: boolean;
  is_bestseller?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export type DonationFund = 'Tithe' | 'Firstfruits' | 'Seed Faith' | 'Building Foundation' | 'Missions & Evangelism' | 'Apostolic Honorarium';
export type PaymentGateway = 'EcoCash' | 'OneMoney' | 'Paynow' | 'Stripe' | 'PayPal' | 'Bank Transfer';

export interface Donation {
  id: string;
  donor_id?: string;
  donor_name: string;
  amount: number;
  currency: 'USD' | 'ZiG' | 'ZAR' | 'GBP';
  fund_type: DonationFund;
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
