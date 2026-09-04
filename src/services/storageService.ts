import { 
  User, 
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
  UserRole, 
  Testimony,
  PremiumPlan,
  BadgeType,
  PaynowConfig
} from '../types';

import { 
  INITIAL_USERS, 
  MOCK_SERMONS, 
  MOCK_DEVOTIONALS, 
  MOCK_COMMUNITY_GROUPS, 
  MOCK_PRAYER_REQUESTS, 
  MOCK_EVENTS, 
  MOCK_PRODUCTS, 
  MOCK_DONATIONS, 
  MOCK_BOOKINGS, 
  MOCK_ORDERS, 
  MOCK_JOE_VIBES, 
  MOCK_PUSH_NOTIFICATIONS, 
  MOCK_TESTIMONIES,
  DEFAULT_PREMIUM_PLANS
} from '../data/mockData';
import { SupabaseSyncService } from './supabaseSyncService';

const KEYS = {
  CURRENT_USER: 'gcz_current_user',
  ALL_USERS: 'gcz_all_users',
  SERMONS: 'gcz_sermons',
  DEVOTIONALS: 'gcz_devotionals',
  TESTIMONIES: 'gcz_testimonies',
  GROUPS: 'gcz_groups',
  PRAYERS: 'gcz_prayers',
  EVENTS: 'gcz_events',
  PRODUCTS: 'gcz_products',
  DONATIONS: 'gcz_donations',
  BOOKINGS: 'gcz_bookings',
  ORDERS: 'gcz_orders',
  JOE_VIBES: 'gcz_joe_vibes',
  PUSH_NOTIFICATIONS: 'gcz_push_notifications',
  LOW_DATA_MODE: 'gcz_low_data_mode',
  SAVED_VERSES: 'gcz_saved_verses',
  OFFLINE_SERMONS: 'gcz_offline_sermons',
  SUPABASE_CONFIG: 'gcz_supabase_config',
  PAYNOW_CONFIG: 'gcz_paynow_config',
  PREMIUM_PLANS: 'gcz_premium_plans'
};

// In-memory fallback dictionary for when third-party cookies or localStorage are restricted/blocked
const memoryStore: Record<string, string> = {};

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isLocalStorageAvailable();

function getLocal<T>(key: string, fallback: T): T {
  try {
    let item: string | null = null;
    if (storageAvailable) {
      item = window.localStorage.getItem(key);
    } else {
      item = memoryStore[key] || null;
    }
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return memoryStore[key] ? (JSON.parse(memoryStore[key]) as T) : fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    memoryStore[key] = serialized;
    if (storageAvailable) {
      window.localStorage.setItem(key, serialized);
    }
  } catch (e) {
    console.warn('LocalStorage unavailable or restricted by browser cookie policy, using in-memory store:', e);
  }
}

export class StorageService {
  // Current User (returns null on first launch or when logged out)
  static getCurrentUser(): User | null {
    const saved = getLocal<User | null>(KEYS.CURRENT_USER, null);
    return saved;
  }

  static setCurrentUser(user: User | null): void {
    if (user === null) {
      this.logout();
    } else {
      setLocal(KEYS.CURRENT_USER, user);
    }
  }

  static getAllUsers(): User[] {
    return getLocal<User[]>(KEYS.ALL_USERS, INITIAL_USERS);
  }

  static saveUser(user: User): void {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === user.id || u.phone === user.phone);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    setLocal(KEYS.ALL_USERS, users);
    const curr = this.getCurrentUser();
    if (curr && curr.id === user.id) {
      this.setCurrentUser(user);
    }
  }

  static updateUserRole(userId: string, newRole: UserRole): void {
    const users = this.getAllUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      target.role = newRole;
      setLocal(KEYS.ALL_USERS, users);
      const curr = this.getCurrentUser();
      if (curr && curr.id === userId) {
        this.setCurrentUser({ ...curr, role: newRole });
      }
    }
  }

  static updateUserProfile(updates: Partial<User>): User | null {
    const curr = this.getCurrentUser();
    if (!curr) return null;
    const updated: User = { ...curr, ...updates };
    this.setCurrentUser(updated);
    this.saveUser(updated);
    return updated;
  }

  // Low Data Mode
  static getLowDataMode(): boolean {
    return getLocal<boolean>(KEYS.LOW_DATA_MODE, false);
  }

  static setLowDataMode(val: boolean): void {
    setLocal(KEYS.LOW_DATA_MODE, val);
  }

  // Sermons
  static getSermons(): Sermon[] {
    return getLocal<Sermon[]>(KEYS.SERMONS, MOCK_SERMONS);
  }

  static addSermon(sermon: Sermon): void {
    const sermons = this.getSermons();
    sermons.unshift(sermon);
    setLocal(KEYS.SERMONS, sermons);
  }

  static toggleOfflineSermon(sermonId: string): boolean {
    const offline = getLocal<string[]>(KEYS.OFFLINE_SERMONS, ['sermon_1', 'sermon_2']);
    const exists = offline.includes(sermonId);
    let updated: string[];
    if (exists) {
      updated = offline.filter(id => id !== sermonId);
    } else {
      if (offline.length >= 5) {
        // limit 5 offline sermons as per spec
        offline.shift();
      }
      updated = [...offline, sermonId];
    }
    setLocal(KEYS.OFFLINE_SERMONS, updated);
    return !exists;
  }

  static getOfflineSermonsList(): string[] {
    return getLocal<string[]>(KEYS.OFFLINE_SERMONS, ['sermon_1', 'sermon_2']);
  }

  // Devotionals
  static getDevotionals(): Devotional[] {
    return getLocal<Devotional[]>(KEYS.DEVOTIONALS, MOCK_DEVOTIONALS);
  }

  static addDevotional(dev: Devotional): void {
    const devs = this.getDevotionals();
    devs.unshift(dev);
    setLocal(KEYS.DEVOTIONALS, devs);
  }

  // Prayer Requests
  static getPrayerRequests(): PrayerRequest[] {
    return getLocal<PrayerRequest[]>(KEYS.PRAYERS, MOCK_PRAYER_REQUESTS);
  }

  static submitPrayer(request: Omit<PrayerRequest, 'id' | 'prayer_count' | 'created_at' | 'status' | 'is_answered'>): PrayerRequest {
    const prayers = this.getPrayerRequests();
    const newPrayer: PrayerRequest = {
      ...request,
      id: `pray_${Date.now()}`,
      prayer_count: 1,
      is_answered: false,
      status: request.is_public ? 'approved' : 'pending',
      created_at: new Date().toISOString()
    };
    prayers.unshift(newPrayer);
    setLocal(KEYS.PRAYERS, prayers);
    // Background sync to Supabase PostgreSQL
    SupabaseSyncService.syncPrayerRequest(newPrayer).catch(err => {
      console.warn('Supabase prayer sync deferred:', err);
    });
    return newPrayer;
  }

  static incrementPrayerCount(prayerId: string): void {
    const prayers = this.getPrayerRequests();
    const p = prayers.find(item => item.id === prayerId);
    if (p) {
      p.prayer_count += 1;
      p.user_prayed = true;
      setLocal(KEYS.PRAYERS, prayers);
    }
  }

  static apostleAnswerPrayer(prayerId: string, notes: string, isAnswered = false): void {
    const prayers = this.getPrayerRequests();
    const p = prayers.find(item => item.id === prayerId);
    if (p) {
      p.apostle_notes = notes;
      p.status = 'apostle_prayed';
      if (isAnswered) {
        p.is_answered = true;
      }
      setLocal(KEYS.PRAYERS, prayers);
    }
  }

  // Groups
  static getGroups(): CommunityGroup[] {
    return getLocal<CommunityGroup[]>(KEYS.GROUPS, MOCK_COMMUNITY_GROUPS);
  }

  static toggleGroupJoin(groupId: string): boolean {
    const groups = this.getGroups();
    const g = groups.find(item => item.id === groupId);
    if (g) {
      g.joined = !g.joined;
      g.member_count += g.joined ? 1 : -1;
      setLocal(KEYS.GROUPS, groups);
      return g.joined;
    }
    return false;
  }

  // Events
  static getEvents(): ChurchEvent[] {
    return getLocal<ChurchEvent[]>(KEYS.EVENTS, MOCK_EVENTS);
  }

  static toggleEventRsvp(eventId: string): boolean {
    const events = this.getEvents();
    const evt = events.find(e => e.id === eventId);
    if (evt) {
      evt.user_rsvpd = !evt.user_rsvpd;
      evt.rsvp_count += evt.user_rsvpd ? 1 : -1;
      setLocal(KEYS.EVENTS, events);
      return evt.user_rsvpd;
    }
    return false;
  }

  static addEvent(event: ChurchEvent): void {
    const events = this.getEvents();
    events.unshift(event);
    setLocal(KEYS.EVENTS, events);
  }

  // Store & Products
  static getProducts(): Product[] {
    return getLocal<Product[]>(KEYS.PRODUCTS, MOCK_PRODUCTS);
  }

  static addProduct(prod: Product): void {
    const prods = this.getProducts();
    prods.unshift(prod);
    setLocal(KEYS.PRODUCTS, prods);
  }

  // Donations
  static getDonations(): Donation[] {
    return getLocal<DonationsList>(KEYS.DONATIONS, MOCK_DONATIONS);
  }

  static recordDonation(donation: Omit<Donation, 'id' | 'receipt_number' | 'created_at' | 'status'>): Donation {
    const donations = this.getDonations();
    const newDonation: Donation = {
      ...donation,
      id: `don_${Date.now()}`,
      receipt_number: `GCZ-RC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    donations.unshift(newDonation);
    setLocal(KEYS.DONATIONS, donations);
    // Background sync to Supabase PostgreSQL
    SupabaseSyncService.syncDonation(newDonation).catch(err => {
      console.warn('Supabase donation sync deferred:', err);
    });
    return newDonation;
  }

  // Bookings
  static getBookings(): ServiceBooking[] {
    return getLocal<ServiceBooking[]>(KEYS.BOOKINGS, MOCK_BOOKINGS);
  }

  static createBooking(booking: Omit<ServiceBooking, 'id' | 'created_at' | 'zoom_link' | 'status'>): ServiceBooking {
    const bookings = this.getBookings();
    const randomMeetingId = Math.floor(80000000000 + Math.random() * 19999999999);
    const newBooking: ServiceBooking = {
      ...booking,
      id: `bk_${Date.now()}`,
      status: 'confirmed',
      zoom_link: `https://zoom.us/j/${randomMeetingId}?pwd=GATEWAY_APOSTLE_JOE`,
      created_at: new Date().toISOString()
    };
    bookings.unshift(newBooking);
    setLocal(KEYS.BOOKINGS, bookings);
    // Background sync to Supabase PostgreSQL
    SupabaseSyncService.syncBooking(newBooking).catch(err => {
      console.warn('Supabase booking sync deferred:', err);
    });
    return newBooking;
  }

  static updateBookingStatus(id: string, status: ServiceBooking['status']): void {
    const bookings = this.getBookings();
    const b = bookings.find(item => item.id === id);
    if (b) {
      b.status = status;
      setLocal(KEYS.BOOKINGS, bookings);
    }
  }

  // Orders
  static getOrders(): Order[] {
    return getLocal<Order[]>(KEYS.ORDERS, MOCK_ORDERS);
  }

  static createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...order,
      id: `ord_${Date.now()}`,
      status: 'Processing',
      created_at: new Date().toISOString()
    };
    orders.unshift(newOrder);
    setLocal(KEYS.ORDERS, orders);
    return newOrder;
  }

  static updateOrderStatus(orderId: string, status: Order['status']): void {
    const orders = this.getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      ord.status = status;
      setLocal(KEYS.ORDERS, orders);
    }
  }

  // Joe Vibes
  static getJoeVibes(): JoeVibesSubmission[] {
    return getLocal<JoeVibesSubmission[]>(KEYS.JOE_VIBES, MOCK_JOE_VIBES);
  }

  static submitJoeVibes(submission: Omit<JoeVibesSubmission, 'id' | 'submitted_at' | 'status'>): JoeVibesSubmission {
    const list = this.getJoeVibes();
    const item: JoeVibesSubmission = {
      ...submission,
      id: `vibes_${Date.now()}`,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };
    list.unshift(item);
    setLocal(KEYS.JOE_VIBES, list);
    return item;
  }

  static updateJoeVibesStatus(id: string, status: JoeVibesSubmission['status'], notes?: string): void {
    const list = this.getJoeVibes();
    const item = list.find(v => v.id === id);
    if (item) {
      item.status = status;
      if (notes) item.notes = notes;
      setLocal(KEYS.JOE_VIBES, list);
    }
  }

  // Push Notifications
  static getPushNotifications(): PushNotification[] {
    return getLocal<PushNotification[]>(KEYS.PUSH_NOTIFICATIONS, MOCK_PUSH_NOTIFICATIONS);
  }

  static sendPushNotification(title: string, body: string, target_segment: PushNotification['target_segment']): PushNotification {
    const notifications = this.getPushNotifications();
    const newNotif: PushNotification = {
      id: `push_${Date.now()}`,
      title,
      body,
      target_segment,
      sent_at: new Date().toISOString(),
      read_count: 0
    };
    notifications.unshift(newNotif);
    setLocal(KEYS.PUSH_NOTIFICATIONS, notifications);
    return newNotif;
  }

  // Saved verses
  static getSavedVerses(): string[] {
    return getLocal<string[]>(KEYS.SAVED_VERSES, ['Psalms 23:1', 'John 1:1', 'Isaiah 40:31', 'Habakkuk 2:2-3']);
  }

  static toggleSavedVerse(verseRef: string): boolean {
    const verses = this.getSavedVerses();
    const exists = verses.includes(verseRef);
    const updated = exists ? verses.filter(v => v !== verseRef) : [...verses, verseRef];
    setLocal(KEYS.SAVED_VERSES, updated);
    return !exists;
  }

  // Testimonies
  static getTestimonies(): Testimony[] {
    const list = getLocal<Testimony[]>(KEYS.TESTIMONIES, MOCK_TESTIMONIES);
    // If list is empty or doesn't have the official posts, merge with default
    if (!list || list.length < 3) {
      setLocal(KEYS.TESTIMONIES, MOCK_TESTIMONIES);
      return MOCK_TESTIMONIES;
    }
    return list;
  }

  static submitTestimony(testimony: Omit<Testimony, 'id' | 'date' | 'likes_count' | 'verified_by_church'>): Testimony {
    const list = this.getTestimonies();
    const newTest: Testimony = {
      ...testimony,
      id: `test_${Date.now()}`,
      date: 'Just Now',
      likes_count: 1,
      verified_by_church: true,
      user_liked: true
    };
    list.unshift(newTest);
    setLocal(KEYS.TESTIMONIES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: newTest }));
    }
    return newTest;
  }

  static likeTestimony(id: string): void {
    const list = this.getTestimonies();
    const target = list.find(t => t.id === id);
    if (target) {
      target.user_liked = !target.user_liked;
      target.likes_count += target.user_liked ? 1 : -1;
      setLocal(KEYS.TESTIMONIES, list);
    }
  }

  static updateTestimony(id: string, updates: Partial<Testimony>): void {
    const list = this.getTestimonies();
    const targetIndex = list.findIndex(t => t.id === id);
    if (targetIndex >= 0) {
      list[targetIndex] = { ...list[targetIndex], ...updates };
      setLocal(KEYS.TESTIMONIES, list);
    }
  }

  static updateTestimonyImage(id: string, newImageUrl: string): void {
    this.updateTestimony(id, { image_url: newImageUrl });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: { id, image_url: newImageUrl } }));
    }
  }

  static deleteTestimony(id: string): void {
    const list = this.getTestimonies().filter(t => t.id !== id);
    setLocal(KEYS.TESTIMONIES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated'));
    }
  }

  // Premium Plans Management (Configurable by Admin)
  static getPremiumPlans(): PremiumPlan[] {
    return getLocal<PremiumPlan[]>(KEYS.PREMIUM_PLANS, DEFAULT_PREMIUM_PLANS);
  }

  static updatePremiumPlans(plans: PremiumPlan[]): void {
    setLocal(KEYS.PREMIUM_PLANS, plans);
  }

  // Unlock single sermon ($5 or specified price)
  static unlockSermon(sermonId: string): User | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    const unlocked = user.unlocked_sermon_ids || [];
    if (!unlocked.includes(sermonId)) {
      unlocked.push(sermonId);
      const updated = this.updateUserProfile({ unlocked_sermon_ids: unlocked });
      return updated;
    }
    return user;
  }

  // Subscribe to Premium (3 months, 6 months, 1 year)
  static subscribePremium(months: number): User | null {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    
    const updated = this.updateUserProfile({
      is_premium: true,
      badge_type: 'blue',
      premium_expires_at: expiry.toISOString().split('T')[0]
    });
    return updated;
  }

  // Auth: Login, Signup, & Logout
  static logout(): void {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(KEYS.CURRENT_USER);
      } catch (e) {
        console.warn(e);
      }
    }
    delete memoryStore[KEYS.CURRENT_USER];
  }

  // Auth: Login & Signup with credentials verification
  static login(phone: string, password?: string): { success: boolean; user?: User; error?: string } {
    const users = this.getAllUsers();
    // Normalize phone numbers (strip spaces, dashes)
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const found = users.find(u => u.phone.replace(/[^0-9+]/g, '') === cleanPhone);
    
    if (found) {
      // Validate password if user has password set
      if (found.password && password && found.password.trim() !== password.trim()) {
        return { 
          success: false, 
          error: `Incorrect password for ${found.full_name}. Please verify credentials.` 
        };
      }
      this.setCurrentUser(found);
      return { success: true, user: found };
    }

    // If not found in users, create as a new covenant member
    const newUser: User = {
      id: `usr_${Date.now()}`,
      phone: phone,
      password: password || 'Gateway2026!',
      full_name: phone === '0780699988' ? 'Lead System Developer' : 'Gateway Believer',
      role: phone === '0780699988' ? 'developer' : 'member',
      badge_type: phone === '0780699988' ? 'gold' : 'none',
      member_id: `GCZ-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      is_verified: true,
      created_at: new Date().toISOString()
    };
    this.saveUser(newUser);
    this.setCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  static signup(fullName: string, phone: string, password: string, referralCode?: string): User {
    const cleanRef = referralCode?.trim().toLowerCase();
    // Secret code 'jd#mode' or 'joedaniels789' grants Moderator role and Silver Verified Badge
    const isModeratorCode = cleanRef === 'jd#mode' || cleanRef === 'joedaniels789';
    const isDevPhone = phone.replace(/[^0-9]/g, '') === '0780699988';

    let role: UserRole = 'member';
    let badge: BadgeType = 'none';

    if (isModeratorCode) {
      role = 'moderator';
      badge = 'silver';
    } else if (isDevPhone) {
      role = 'developer';
      badge = 'gold';
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      phone,
      password: password || 'Gateway2026!',
      full_name: fullName,
      role,
      badge_type: badge,
      referral_code: referralCode,
      member_id: `GCZ-${role === 'moderator' ? 'MOD' : (role === 'developer' ? 'DEV' : 'MEM')}-${Math.floor(1000 + Math.random() * 9000)}`,
      is_verified: true,
      created_at: new Date().toISOString(),
      saved_verses: ['John 1:1', 'Isaiah 40:31']
    };

    this.saveUser(newUser);
    this.setCurrentUser(newUser);
    return newUser;
  }

  // Supabase Config
  static getSupabaseConfig(): { url: string; anonKey: string; isLiveConnected: boolean } {
    return getLocal(KEYS.SUPABASE_CONFIG, {
      url: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://csinlqdcqdgcssdanvsr.supabase.co',
      anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TJvwQ_lcZtUL0hHOm1yJmA_rfhpBKEX',
      isLiveConnected: true
    });
  }

  static setSupabaseConfig(config: { url: string; anonKey: string; isLiveConnected: boolean }): void {
    setLocal(KEYS.SUPABASE_CONFIG, config);
  }

  static removeSavedVerse(verseKey: string): User | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    const currentList = user.saved_verses || [];
    const updatedList = currentList.filter(v => v !== verseKey);
    return this.updateUserProfile({ saved_verses: updatedList });
  }

  static addSavedVerse(verseKey: string): User | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    const currentList = user.saved_verses || [];
    if (!currentList.includes(verseKey)) {
      return this.updateUserProfile({ saved_verses: [...currentList, verseKey] });
    }
    return user;
  }

  // Paynow Zimbabwe Gateway Configuration
  static getPaynowConfig(): PaynowConfig {
    return getLocal<PaynowConfig>(KEYS.PAYNOW_CONFIG, {
      integrationId: '',
      integrationKey: '',
      isLive: true,
      merchantEmail: 'gatewaychurchzim@gmail.com',
      isConfigured: false
    });
  }

  static setPaynowConfig(config: PaynowConfig): void {
    setLocal(KEYS.PAYNOW_CONFIG, config);
  }
}

type DonationsList = Donation[];
