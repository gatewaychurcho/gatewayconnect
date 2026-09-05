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
  PostComment,
  PremiumPlan,
  BadgeType,
  PaynowConfig,
  UnbanAppeal,
  PasswordResetRequest
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
  PREMIUM_PLANS: 'gcz_premium_plans',
  BANNED_USERS: 'gcz_banned_users',
  UNBAN_APPEALS: 'gcz_unban_appeals',
  PASSWORD_RESETS: 'gcz_password_resets'
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
    const saved = getLocal<User[]>(KEYS.ALL_USERS, INITIAL_USERS);
    // Ensure all 10 registered accounts exist in the storage pool & normalize any old inflated counts
    const existingIds = new Set(saved.map(u => u.id));
    let changed = false;
    for (const initUser of INITIAL_USERS) {
      if (!existingIds.has(initUser.id)) {
        saved.push(initUser);
        changed = true;
      }
    }
    for (const u of saved) {
      // Fix unrealistic follower counts if stored from older versions
      if (u.followers_count && u.followers_count > 10) {
        const matchingInit = INITIAL_USERS.find(iu => iu.id === u.id);
        u.followers_count = matchingInit ? matchingInit.followers_count : 4;
        changed = true;
      }
      if (u.following_count && u.following_count > 10) {
        const matchingInit = INITIAL_USERS.find(iu => iu.id === u.id);
        u.following_count = matchingInit ? matchingInit.following_count : 3;
        changed = true;
      }
    }
    if (changed) {
      setLocal(KEYS.ALL_USERS, saved);
    }
    return saved;
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

  static toggleOfflineSermon(sermonId: string, currentUser?: User | null): { success: boolean; isDownloaded: boolean; message: string } {
    const offline = getLocal<string[]>(KEYS.OFFLINE_SERMONS, ['sermon_1', 'sermon_2']);
    const exists = offline.includes(sermonId);
    const user = currentUser || this.getCurrentUser();
    const isPremium = user?.is_premium || user?.role === 'super_admin' || user?.role === 'developer';

    if (exists) {
      const updated = offline.filter(id => id !== sermonId);
      setLocal(KEYS.OFFLINE_SERMONS, updated);
      return { success: true, isDownloaded: false, message: 'Removed from downloaded sermons.' };
    } else {
      if (!isPremium && offline.length >= 5) {
        return {
          success: false,
          isDownloaded: false,
          message: 'Free limit reached: Normal accounts are limited to 5 offline sermon downloads per month. Upgrade to Premium for unlimited downloads!'
        };
      }
      const updated = [...offline, sermonId];
      setLocal(KEYS.OFFLINE_SERMONS, updated);
      return { success: true, isDownloaded: true, message: 'Downloaded for offline playback!' };
    }
  }

  static getOfflineSermonsList(): string[] {
    return getLocal<string[]>(KEYS.OFFLINE_SERMONS, ['sermon_1', 'sermon_2']);
  }

  static getDownloadedSermons(): Sermon[] {
    const ids = this.getOfflineSermonsList();
    const all = this.getSermons();
    return all.filter(s => ids.includes(s.id));
  }

  static deleteDownloadedSermon(sermonId: string): void {
    const offline = getLocal<string[]>(KEYS.OFFLINE_SERMONS, ['sermon_1', 'sermon_2']);
    const updated = offline.filter(id => id !== sermonId);
    setLocal(KEYS.OFFLINE_SERMONS, updated);
  }

  static getDownloadQuota(currentUser?: User | null): { used: number; max: number; isUnlimited: boolean; remaining: number; limit: number } {
    const user = currentUser || this.getCurrentUser();
    const isPremium = user?.is_premium || user?.role === 'super_admin' || user?.role === 'developer';
    const used = this.getOfflineSermonsList().length;
    const max = isPremium ? 9999 : 5;
    return {
      used,
      max,
      isUnlimited: isPremium,
      remaining: Math.max(0, max - used),
      limit: max
    };
  }

  static toggleFollowUser(targetUserId: string): { isFollowing: boolean; targetUserFollowers: number } {
    const currentUser = this.getCurrentUser();
    const allUsers = this.getAllUsers();
    const followingKey = `following_list_${currentUser?.id || 'guest'}`;
    const followingList = getLocal<string[]>(followingKey, ['usr_apostle_joe', 'usr_developer']);
    const isCurrentlyFollowing = followingList.includes(targetUserId);

    let updatedList: string[];
    const targetUser = allUsers.find(u => u.id === targetUserId);

    if (isCurrentlyFollowing) {
      updatedList = followingList.filter(id => id !== targetUserId);
      if (targetUser && targetUser.followers_count && targetUser.followers_count > 0) {
        targetUser.followers_count = Math.max(0, targetUser.followers_count - 1);
      }
      if (currentUser && currentUser.following_count && currentUser.following_count > 0) {
        currentUser.following_count = Math.max(0, currentUser.following_count - 1);
      }
    } else {
      updatedList = [...followingList, targetUserId];
      if (targetUser) {
        targetUser.followers_count = (targetUser.followers_count || 0) + 1;
      }
      if (currentUser) {
        currentUser.following_count = (currentUser.following_count || 0) + 1;
      }
    }

    setLocal(followingKey, updatedList);
    setLocal(KEYS.ALL_USERS, allUsers);
    if (currentUser) {
      this.setCurrentUser(currentUser);
    }

    return {
      isFollowing: !isCurrentlyFollowing,
      targetUserFollowers: targetUser?.followers_count || 1
    };
  }

  static getFollowingList(userId?: string): string[] {
    const uid = userId || this.getCurrentUser()?.id || 'guest';
    return getLocal<string[]>(`following_list_${uid}`, ['usr_apostle_joe', 'usr_developer']);
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

  // Testimonies & Posts
  static getTestimonies(): Testimony[] {
    const list = getLocal<Testimony[]>(KEYS.TESTIMONIES, MOCK_TESTIMONIES);
    // If list is legacy, empty, or lacks liked_user_ids, refresh to the 10 real community accounts
    const validAccountIds = new Set(INITIAL_USERS.map(u => u.id));
    const hasLegacyData = !list || list.length < 3 || list.some(t => !Array.isArray(t.liked_user_ids) || (t.user_id && !validAccountIds.has(t.user_id)));
    if (hasLegacyData) {
      setLocal(KEYS.TESTIMONIES, MOCK_TESTIMONIES);
      return MOCK_TESTIMONIES;
    }
    return list;
  }

  static submitTestimony(testimony: Omit<Testimony, 'id' | 'date' | 'likes_count' | 'verified_by_church' | 'liked_user_ids' | 'user_liked' | 'comments' | 'comments_count'>): Testimony {
    const list = this.getTestimonies();
    const newTest: Testimony = {
      ...testimony,
      id: `test_${Date.now()}`,
      date: 'Just now',
      created_at: new Date().toISOString(),
      liked_user_ids: [],
      likes_count: 0,
      user_liked: false,
      comments: [],
      comments_count: 0,
      verified_by_church: true
    };
    list.unshift(newTest);
    setLocal(KEYS.TESTIMONIES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: newTest }));
    }
    return newTest;
  }

  static likeTestimony(id: string, userId?: string): { user_liked: boolean; likes_count: number } {
    const list = this.getTestimonies();
    const target = list.find(t => t.id === id);
    if (!target) return { user_liked: false, likes_count: 0 };

    const currUser = this.getCurrentUser();
    const effectiveUserId = userId || currUser?.id || 'usr_guest';

    if (!Array.isArray(target.liked_user_ids)) {
      target.liked_user_ids = [];
    }

    const alreadyLiked = target.liked_user_ids.includes(effectiveUserId);
    if (alreadyLiked) {
      target.liked_user_ids = target.liked_user_ids.filter(uid => uid !== effectiveUserId);
    } else {
      target.liked_user_ids.push(effectiveUserId);
    }

    target.likes_count = target.liked_user_ids.length;
    target.user_liked = !alreadyLiked;

    setLocal(KEYS.TESTIMONIES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: target }));
    }
    return { user_liked: target.user_liked, likes_count: target.likes_count };
  }

  static addCommentToTestimony(postId: string, text: string, user?: User | null): PostComment | null {
    const list = this.getTestimonies();
    const target = list.find(t => t.id === postId);
    if (!target) return null;

    const author = user || this.getCurrentUser();
    if (!author) return null;

    if (!Array.isArray(target.comments)) {
      target.comments = [];
    }

    const newComment: PostComment = {
      id: `comm_${Date.now()}`,
      user_id: author.id,
      user_name: author.full_name,
      user_handle: author.handle || `@${author.full_name.toLowerCase().replace(/\s+/g, '_')}`,
      user_avatar: author.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
      text: text.trim(),
      created_at: new Date().toISOString(),
      likes_count: 0,
      badge_type: author.badge_type || (author.is_verified ? 'blue' : 'none')
    };

    target.comments.push(newComment);
    target.comments_count = target.comments.length;

    setLocal(KEYS.TESTIMONIES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: target }));
    }
    return newComment;
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

    const autoFollowIds = ['usr_apostle_joe', 'usr_developer'];
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
      saved_verses: ['John 1:1', 'Isaiah 40:31'],
      followers_count: 0,
      following_count: autoFollowIds.length
    };

    setLocal(`following_list_${newUser.id}`, autoFollowIds);
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

  // Developer God Mode: Account Bans & Security
  static getBannedUsers(): Record<string, { banned_at: string; reason: string }> {
    return getLocal<Record<string, { banned_at: string; reason: string }>>(KEYS.BANNED_USERS, {});
  }

  static isUserBanned(userIdOrPhone: string): { isBanned: boolean; reason?: string; banned_at?: string } {
    const bannedMap = this.getBannedUsers();
    // Check by user ID or clean phone
    const clean = userIdOrPhone.replace(/[^0-9]/g, '');
    if (bannedMap[userIdOrPhone]) {
      return { isBanned: true, reason: bannedMap[userIdOrPhone].reason, banned_at: bannedMap[userIdOrPhone].banned_at };
    }
    for (const [key, val] of Object.entries(bannedMap)) {
      if (key === userIdOrPhone || (clean && key.replace(/[^0-9]/g, '') === clean)) {
        return { isBanned: true, reason: val.reason, banned_at: val.banned_at };
      }
    }
    return { isBanned: false };
  }

  static banUser(userIdOrPhone: string, reason: string = 'Violation of Community Fellowship Guidelines or Administrative Restraint'): void {
    const map = this.getBannedUsers();
    map[userIdOrPhone] = {
      banned_at: new Date().toISOString(),
      reason
    };
    setLocal(KEYS.BANNED_USERS, map);

    // Also flag in all users
    const allUsers = this.getAllUsers();
    const u = allUsers.find(user => user.id === userIdOrPhone || user.phone === userIdOrPhone);
    if (u) {
      u.is_banned = true;
      u.ban_reason = reason;
      setLocal(KEYS.ALL_USERS, allUsers);
    }
  }

  static unbanUser(userIdOrPhone: string): void {
    const map = this.getBannedUsers();
    delete map[userIdOrPhone];
    const clean = userIdOrPhone.replace(/[^0-9]/g, '');
    for (const key of Object.keys(map)) {
      if (key === userIdOrPhone || (clean && key.replace(/[^0-9]/g, '') === clean)) {
        delete map[key];
      }
    }
    setLocal(KEYS.BANNED_USERS, map);

    // Also unflag in all users
    const allUsers = this.getAllUsers();
    const u = allUsers.find(user => user.id === userIdOrPhone || user.phone === userIdOrPhone);
    if (u) {
      u.is_banned = false;
      u.ban_reason = undefined;
      setLocal(KEYS.ALL_USERS, allUsers);
    }
  }

  // Unban Appeals (Blind Chat with Developer & Admin)
  static getUnbanAppeals(): UnbanAppeal[] {
    return getLocal<UnbanAppeal[]>(KEYS.UNBAN_APPEALS, [
      {
        id: 'appeal_demo_1',
        user_id: 'usr_guest',
        user_name: 'Member Appeal',
        user_phone: '0712345678',
        reason: 'Greetings Developer & Apostle. Please review my account suspension. I was sharing Sunday choir recordings in the group.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'pending'
      }
    ]);
  }

  static submitUnbanAppeal(appeal: Omit<UnbanAppeal, 'id' | 'created_at' | 'status'>): UnbanAppeal {
    const list = this.getUnbanAppeals();
    const newAppeal: UnbanAppeal = {
      ...appeal,
      id: `appeal_${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    list.unshift(newAppeal);
    setLocal(KEYS.UNBAN_APPEALS, list);
    return newAppeal;
  }

  static resolveUnbanAppeal(appealId: string, status: 'approved' | 'rejected'): void {
    const list = this.getUnbanAppeals();
    const item = list.find(a => a.id === appealId);
    if (item) {
      item.status = status;
      if (status === 'approved') {
        this.unbanUser(item.user_id);
        this.unbanUser(item.user_phone);
      }
      setLocal(KEYS.UNBAN_APPEALS, list);
    }
  }

  // Password Recovery Requests
  static getPasswordResetRequests(): PasswordResetRequest[] {
    return getLocal<PasswordResetRequest[]>(KEYS.PASSWORD_RESETS, []);
  }

  static submitPasswordResetRequest(phone: string, note: string = 'User requested password recovery from Lead Developer', userName?: string): PasswordResetRequest {
    const list = this.getPasswordResetRequests();
    const req: PasswordResetRequest = {
      id: `pwd_req_${Date.now()}`,
      phone,
      user_name: userName || 'Gateway Member',
      note,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    list.unshift(req);
    setLocal(KEYS.PASSWORD_RESETS, list);
    return req;
  }

  static resolvePasswordResetRequest(id: string): void {
    const list = this.getPasswordResetRequests();
    const item = list.find(r => r.id === id);
    if (item) {
      item.status = 'resolved';
      setLocal(KEYS.PASSWORD_RESETS, list);
    }
  }

  static updateUserPassword(phoneOrUserId: string, newPass: string): boolean {
    const allUsers = this.getAllUsers();
    const u = allUsers.find(user => user.id === phoneOrUserId || user.phone === phoneOrUserId);
    if (u) {
      u.password = newPass;
      setLocal(KEYS.ALL_USERS, allUsers);
      const cur = this.getCurrentUser();
      if (cur && (cur.id === u.id || cur.phone === u.phone)) {
        cur.password = newPass;
        this.setCurrentUser(cur);
      }
      return true;
    }
    return false;
  }
}

type DonationsList = Donation[];
