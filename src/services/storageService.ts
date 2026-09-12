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
  PasswordResetRequest,
  CommunityStory,
  DirectMessage,
  LiveStreamViewer,
  CongregationUnit,
  DmThread,
  SUPPORTED_CITIES,
  SupportedCity,
  StreamAttendanceRecord,
  AppNotification,
  ChatGroup,
  ChatGroupMessage,
  GroupMembership,
  GroupInvite,
  StreamPlatform,
  StreamEmbedInfo,
  PastorLocationRequest,
  CartItem,
  MessageReaction,
  GroupMediaItem,
  NotificationSettings,
  Receipt
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
  DEFAULT_PREMIUM_PLANS,
  INITIAL_CHAT_GROUPS,
  INITIAL_CHAT_GROUP_MESSAGES
} from '../data/mockData';
import { SupabaseSyncService } from './supabaseSyncService';
import { CONFIG } from '../../config';

export function arePhoneNumbersEqual(phone1?: string, phone2?: string): boolean {
  if (!phone1 || !phone2) return false;
  const p1 = phone1.replace(/[^0-9]/g, '');
  const p2 = phone2.replace(/[^0-9]/g, '');
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  // Normalize Zimbabwe prefix 263 <-> 0
  const norm1 = p1.startsWith('263') ? '0' + p1.slice(3) : p1;
  const norm2 = p2.startsWith('263') ? '0' + p2.slice(3) : p2;
  return norm1 === norm2;
}

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
  PASSWORD_RESETS: 'gcz_password_resets',
  COMMUNITY_STORIES: 'gcz_community_stories',
  USER_FOLLOWS: 'gcz_user_follows',
  DIRECT_MESSAGES: 'gcz_direct_messages',
  LIVE_SERMON: 'gcz_live_sermon',
  STREAM_VIEWERS: 'gcz_stream_viewers',
  STREAM_ATTENDANCE_HISTORY: 'gcz_stream_attendance_history_v1',
  APP_NOTIFICATIONS: 'gcz_app_notifications_v1',
  CHAT_GROUPS: 'gcz_chat_groups_v1',
  CHAT_GROUP_MESSAGES: 'gcz_chat_group_messages_v1',
  GROUP_INVITES: 'gcz_group_invites_v1',
  GROUP_MEMBERSHIPS: 'gcz_group_memberships_v1',
  USER_FOLLOWS_TABLE: 'gcz_user_follows_table_v2',
  POST_LIKES_TABLE: 'gcz_post_likes_table_v2',
  STORY_LIKES: 'gcz_story_likes_v1',
  LIVE_STREAM_URL: 'gcz_live_stream_url_v1',
  PASTOR_LOCATION_REQUESTS: 'gcz_pastor_location_requests_v1',
  KINGDOM_STORE_CART: 'gcz_kingdom_store_cart_v1',
  GROUP_MEDIA: 'gcz_group_media_v1',
  NOTIFICATION_SETTINGS: 'gcz_notification_settings_v1',
  RECEIPTS_ARCHIVE: 'gcz_receipts_archive_v1',
  THEME: 'gcz_theme_v1',
  DISSOLVED_GROUPS: 'gcz_dissolved_groups_v1'
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
  // Permanent Custom User Avatars store
  static getPermanentCustomAvatars(): Record<string, string> {
    return getLocal<Record<string, string>>('gcz_permanent_custom_avatars', {});
  }

  static setPermanentCustomAvatar(userId: string, phone: string, avatarUrl: string): void {
    const avatars = this.getPermanentCustomAvatars();
    if (userId) avatars[userId] = avatarUrl;
    if (phone) avatars[phone] = avatarUrl;
    setLocal('gcz_permanent_custom_avatars', avatars);
    // Sync to Supabase profile_pictures table
    if (userId) {
      SupabaseSyncService.syncProfilePicture(userId, avatarUrl).catch(() => {});
    }
  }

  static async hydrateProfilePictureFromSupabase(userId: string): Promise<string | null> {
    if (!userId) return null;
    try {
      const remoteAvatar = await SupabaseSyncService.fetchProfilePicture(userId);
      if (remoteAvatar) {
        const avatars = this.getPermanentCustomAvatars();
        avatars[userId] = remoteAvatar;
        setLocal('gcz_permanent_custom_avatars', avatars);
        const curr = this.getCurrentUser();
        if (curr && curr.id === userId && curr.avatar_url !== remoteAvatar) {
          curr.avatar_url = remoteAvatar;
          setLocal(KEYS.CURRENT_USER, curr);
        }
        return remoteAvatar;
      }
    } catch {
      // Ignore network errors
    }
    return null;
  }

  // Current User (returns null on first launch or when logged out)
  static getCurrentUser(): User | null {
    const saved = getLocal<User | null>(KEYS.CURRENT_USER, null);
    if (saved) {
      if (saved.id === 'usr_developer' || saved.role === 'developer' || saved.phone === '0780699988') {
        if (saved.full_name !== 'mr_juice7' || saved.handle !== '@mr_juice7') {
          saved.full_name = 'mr_juice7';
          saved.handle = '@mr_juice7';
          setLocal(KEYS.CURRENT_USER, saved);
        }
      }
      const customAvatars = this.getPermanentCustomAvatars();
      if (customAvatars[saved.id] || customAvatars[saved.phone]) {
        saved.avatar_url = customAvatars[saved.id] || customAvatars[saved.phone];
      }
    }
    return saved;
  }

  static setCurrentUser(user: User | null): void {
    if (user === null) {
      this.logout();
    } else {
      if (user.avatar_url) {
        this.setPermanentCustomAvatar(user.id, user.phone, user.avatar_url);
      }
      setLocal(KEYS.CURRENT_USER, user);
    }
  }

  static getAllUsers(): User[] {
    const saved = getLocal<User[]>(KEYS.ALL_USERS, INITIAL_USERS);
    // Ensure all registered accounts exist in the storage pool & normalize developer credentials
    const existingIds = new Set(saved.map(u => u.id));
    let changed = false;
    for (const initUser of INITIAL_USERS) {
      if (!existingIds.has(initUser.id)) {
        saved.push(initUser);
        changed = true;
      }
    }
    // Strictly enforce single developer account: phone 0780699988, password juice2026, handle @mr_juice7, username mr_juice7
    const devUsers = saved.filter(u => u.role === 'developer' || u.phone === '0780699988' || u.handle === '@mr_juice7');
    if (devUsers.length > 1) {
      const primary = devUsers.find(u => u.id === 'usr_developer') || devUsers[0];
      const dupes = new Set(devUsers.filter(u => u !== primary).map(u => u.id));
      const remaining = saved.filter(u => !dupes.has(u.id));
      saved.length = 0;
      saved.push(...remaining);
      changed = true;
    }
    const devUser = saved.find(u => u.id === 'usr_developer' || u.role === 'developer' || u.phone === '0780699988');
    if (devUser) {
      if (devUser.phone !== '0780699988' || devUser.password !== 'juice2026' || devUser.handle !== '@mr_juice7' || devUser.full_name !== 'mr_juice7') {
        devUser.phone = '0780699988';
        devUser.password = 'juice2026';
        devUser.handle = '@mr_juice7';
        devUser.full_name = 'mr_juice7';
        devUser.role = 'developer';
        changed = true;
      }
    }

    // Apply permanent custom avatars so profile photos stay forever
    const customAvatars = this.getPermanentCustomAvatars();
    saved.forEach(u => {
      if (customAvatars[u.id] || customAvatars[u.phone]) {
        u.avatar_url = customAvatars[u.id] || customAvatars[u.phone];
      }
    });

    if (changed) {
      setLocal(KEYS.ALL_USERS, saved);
    }
    return saved;
  }

  static saveUser(user: User): void {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === user.id || arePhoneNumbersEqual(u.phone, user.phone));
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    setLocal(KEYS.ALL_USERS, users);
    // If saving the active user, update currentUser as well
    const cur = this.getCurrentUser();
    if (cur && (cur.id === user.id || arePhoneNumbersEqual(cur.phone, user.phone))) {
      setLocal(KEYS.CURRENT_USER, { ...cur, ...user });
    }

    SupabaseSyncService.syncUser(user).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_user_profile_updated', { detail: user }));
      window.dispatchEvent(new CustomEvent('gcz_user_registered', { detail: user }));
      window.dispatchEvent(new CustomEvent('gcz_users_synced', { detail: users }));
    }
  }

  static async syncUsersWithRemote(): Promise<void> {
    try {
      const remoteUsers = await SupabaseSyncService.pullUsersFromSupabase();
      if (!remoteUsers || remoteUsers.length === 0) return;
      const localUsers = this.getAllUsers();
      let changed = false;
      for (const ru of remoteUsers) {
        const localIdx = localUsers.findIndex(u => u.id === ru.id || arePhoneNumbersEqual(u.phone, ru.phone));
        if (localIdx >= 0) {
          localUsers[localIdx] = {
            ...localUsers[localIdx],
            avatar_url: ru.avatar_url || localUsers[localIdx].avatar_url,
            full_name: ru.full_name || localUsers[localIdx].full_name,
            handle: ru.handle || localUsers[localIdx].handle,
            role: ru.role || localUsers[localIdx].role,
            followers_count: ru.followers_count || localUsers[localIdx].followers_count,
            following_count: ru.following_count || localUsers[localIdx].following_count
          };
          changed = true;
        } else {
          localUsers.push(ru);
          changed = true;
        }
      }
      if (changed) {
        setLocal(KEYS.ALL_USERS, localUsers);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gcz_users_synced'));
        }
      }
    } catch {}
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
    if (updates.avatar_url) {
      this.setPermanentCustomAvatar(curr.id, curr.phone, updates.avatar_url);
    }
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

  // DEDICATED USER FOLLOWS TABLE PERSISTENCE
  static getUserFollowsRecords(): { follower_id: string; following_id: string; created_at: string }[] {
    const defaultFollows = [
      { follower_id: 'usr_tinashe', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_tinashe', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_developer', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_pastor_tendai', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_pastor_tendai', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_pastor_grace', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_pastor_grace', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_chipo', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_chipo', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_kuda', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_kuda', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_tatenda', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_tatenda', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_nyasha', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_nyasha', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_farai', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_farai', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_apostle_joe', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_apostle_joe', following_id: 'usr_prophetess_melinda', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_prophetess_melinda', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_prophetess_melinda', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_pastor_easter', following_id: 'usr_apostle_joe', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: 'usr_pastor_easter', following_id: 'usr_developer', created_at: '2026-01-01T00:00:00Z' }
    ];
    let records = getLocal<{ follower_id: string; following_id: string; created_at: string }[] | null>(KEYS.USER_FOLLOWS_TABLE, null);
    if (!records) {
      records = [...defaultFollows];
      setLocal(KEYS.USER_FOLLOWS_TABLE, records);
    }
    return records;
  }

  static toggleFollowUser(targetUserId: string, explicitFollowerId?: string): { isFollowing: boolean; targetUserFollowers: number } {
    const currentUser = this.getCurrentUser();
    const followerId = explicitFollowerId || currentUser?.id || 'guest';
    const allUsers = this.getAllUsers();
    
    // Normalize aliases
    const effectiveTargetId = (targetUserId === 'usr_daniels' || targetUserId === 'usr_pastor_joe') ? 'usr_apostle_joe' : targetUserId;
    const effectiveFollowerId = (followerId === 'usr_daniels' || followerId === 'usr_pastor_joe') ? 'usr_apostle_joe' : followerId;

    const records = this.getUserFollowsRecords();
    const existingIndex = records.findIndex(
      r => r.follower_id === effectiveFollowerId && (r.following_id === effectiveTargetId || r.following_id === targetUserId)
    );
    const isCurrentlyFollowing = existingIndex >= 0;

    if (isCurrentlyFollowing) {
      records.splice(existingIndex, 1);
    } else {
      records.push({
        follower_id: effectiveFollowerId,
        following_id: effectiveTargetId,
        created_at: new Date().toISOString()
      });
    }

    setLocal(KEYS.USER_FOLLOWS_TABLE, records);

    // Re-calculate persistent counts strictly in line with actual user activity in the app
    const targetUser = allUsers.find(u => u.id === effectiveTargetId || u.id === targetUserId);
    const followerUser = allUsers.find(u => u.id === effectiveFollowerId);
    
    if (targetUser) {
      targetUser.followers_count = records.filter(r => r.following_id === effectiveTargetId || r.following_id === targetUserId).length;
    }
    if (followerUser) {
      followerUser.following_count = records.filter(r => r.follower_id === effectiveFollowerId).length;
    }

    setLocal(KEYS.ALL_USERS, allUsers);
    if (currentUser && currentUser.id === effectiveFollowerId && followerUser) {
      this.setCurrentUser({ ...currentUser, following_count: followerUser.following_count });
    }

    // Interactive notification on follow
    if (!isCurrentlyFollowing && targetUser) {
      this.addAppNotification({
        type: 'follow',
        actor_id: effectiveFollowerId,
        actor_name: followerUser?.full_name || 'A believer',
        actor_avatar: followerUser?.avatar_url,
        title: 'New Follower Joined',
        message: `${followerUser?.full_name || 'A believer'} (@${followerUser?.handle?.replace('@', '') || 'member'}) is now following your ministry profile.`,
        recipient_id: targetUser.id,
        link_tab: 'profile',
        meta_id: effectiveFollowerId
      });
    }

    // Sync to Supabase table in background
    SupabaseSyncService.syncFollowState(effectiveFollowerId, effectiveTargetId, !isCurrentlyFollowing).catch(() => {});

    // Dispatch global event for instant UI updates across tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_follow_updated', { 
        detail: { followerId: effectiveFollowerId, targetUserId: effectiveTargetId, isFollowing: !isCurrentlyFollowing } 
      }));
      window.dispatchEvent(new CustomEvent('gcz_user_profile_updated'));
      window.dispatchEvent(new CustomEvent('gcz_notifications_updated'));
    }

    return {
      isFollowing: !isCurrentlyFollowing,
      targetUserFollowers: targetUser?.followers_count || 1
    };
  }

  static getFollowingList(userId?: string): string[] {
    const uid = userId || this.getCurrentUser()?.id || 'guest';
    const effectiveUid = (uid === 'usr_daniels' || uid === 'usr_pastor_joe') ? 'usr_apostle_joe' : uid;
    const records = this.getUserFollowsRecords();
    return records.filter(r => r.follower_id === effectiveUid).map(r => r.following_id);
  }

  static getFollowersList(targetUserId: string): string[] {
    const effectiveTargetId = (targetUserId === 'usr_daniels' || targetUserId === 'usr_pastor_joe') ? 'usr_apostle_joe' : targetUserId;
    const records = this.getUserFollowsRecords();
    return records
      .filter(r => r.following_id === effectiveTargetId || r.following_id === targetUserId)
      .map(r => r.follower_id);
  }

  static getFollowingUsers(userId: string): User[] {
    const followingIds = this.getFollowingList(userId);
    const allUsers = this.getAllUsers();
    return allUsers.filter(u => followingIds.includes(u.id) || (u.role === 'super_admin' && followingIds.includes('usr_apostle_joe')));
  }

  static getFollowersUsers(userId: string): User[] {
    const followerIds = this.getFollowersList(userId);
    const allUsers = this.getAllUsers();
    return allUsers.filter(u => followerIds.includes(u.id));
  }

  static async hydrateFollowsFromSupabase(userId: string): Promise<void> {
    if (!userId || userId === 'guest') return;
    try {
      const data = await SupabaseSyncService.fetchFollows(userId);
      if (data && (data.following.length > 0 || data.followers.length > 0)) {
        const records = this.getUserFollowsRecords();
        let modified = false;
        for (const targetId of data.following) {
          if (!records.some(r => r.follower_id === userId && r.following_id === targetId)) {
            records.push({ follower_id: userId, following_id: targetId, created_at: new Date().toISOString() });
            modified = true;
          }
        }
        for (const followerId of data.followers) {
          if (!records.some(r => r.follower_id === followerId && r.following_id === userId)) {
            records.push({ follower_id: followerId, following_id: userId, created_at: new Date().toISOString() });
            modified = true;
          }
        }
        if (modified) {
          setLocal(KEYS.USER_FOLLOWS_TABLE, records);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gcz_follow_updated', {
              detail: { userId }
            }));
          }
        }
      }
    } catch {
      // Ignore background network error
    }
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
    const prayers = getLocal<PrayerRequest[]>(KEYS.PRAYERS, MOCK_PRAYER_REQUESTS);
    const allUsers = this.getAllUsers();
    prayers.forEach(p => {
      if (p.user_id && !p.is_anonymous) {
        const u = allUsers.find(usr => usr.id === p.user_id);
        if (u) {
          p.user_name = u.full_name;
        }
      }
    });
    return prayers;
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_prayer_updated', { detail: newPrayer }));
    }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_prayer_updated', { detail: p }));
      }
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
  static getGroups(explicitUserId?: string): CommunityGroup[] {
    const dissolved = new Set(getLocal<string[]>(KEYS.DISSOLVED_GROUPS, []));
    let list = getLocal<CommunityGroup[]>(KEYS.GROUPS, MOCK_COMMUNITY_GROUPS);
    if (!list || list.length === 0) {
      list = MOCK_COMMUNITY_GROUPS.filter(g => !dissolved.has(g.id));
      setLocal(KEYS.GROUPS, list);
    }
    const chatGroups = this.getChatGroups();
    const chatGroupIds = new Set(chatGroups.map(c => c.id));
    list = list.filter(g => !dissolved.has(g.id) && chatGroupIds.has(g.id));
    const targetUserId = explicitUserId || this.getCurrentUser()?.id;

    // Return mapped copy where joined is computed dynamically for targetUserId ONLY
    return list.map(group => {
      const cg = chatGroups.find(c => c.id === group.id);
      const memberCount = cg ? cg.member_ids.length : (group.member_count || 0);
      const hasExited = targetUserId ? this.hasUserExitedGroup(group.id, targetUserId) : false;
      const isMember = (cg && targetUserId)
        ? cg.member_ids.includes(targetUserId)
        : false;
      return {
        ...group,
        member_count: memberCount,
        joined: isMember,
        member_ids: cg ? cg.member_ids : []
      };
    });
  }

  static hasUserExitedGroup(groupId: string, userId?: string): boolean {
    const targetUserId = userId || this.getCurrentUser()?.id;
    if (!groupId || !targetUserId) return false;
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(`gcz_exited_${groupId}_${targetUserId}`) === 'true') {
        return true;
      }
    } catch {}
    const memberships = getLocal<GroupMembership[]>(KEYS.GROUP_MEMBERSHIPS, []);
    const m = memberships.find(mem => mem.group_id === groupId && mem.user_id === targetUserId);
    if (m && m.status === 'expired' && !!m.left_at) {
      return true;
    }
    return false;
  }

  static isUserInChatGroup(groupId: string, userId?: string): boolean {
    const targetUserId = userId || this.getCurrentUser()?.id;
    if (!groupId || !targetUserId) return false;
    if (this.hasUserExitedGroup(groupId, targetUserId)) return false;
    const chatGroups = this.getChatGroups();
    const cg = chatGroups.find(c => c.id === groupId);
    if (!cg) return false;
    return cg.member_ids.includes(targetUserId);
  }

  static toggleGroupJoin(groupId: string, userId?: string): boolean {
    const currUser = userId ? this.getAllUsers().find(u => u.id === userId) : this.getCurrentUser();
    if (!currUser) return false;
    const currentUserId = currUser.id;
    const isMember = this.isUserInChatGroup(groupId, currentUserId);

    if (isMember) {
      this.leaveChatGroup(groupId, currentUserId);
      return false;
    } else {
      this.joinChatGroup(groupId, currentUserId);
      return true;
    }
  }

  // Events (with 2 Permanent Services that never leave: Sunday 08:00-13:00 & Wednesday 17:00-20:00)
  static getEvents(): ChurchEvent[] {
    let list = getLocal<ChurchEvent[]>(KEYS.EVENTS, MOCK_EVENTS);
    if (!list || list.length === 0) {
      list = [...MOCK_EVENTS];
    }

    // Ensure Sunday permanent service is present
    let sundayEvt = list.find(e => e.id === 'evt_sunday');
    if (!sundayEvt) {
      sundayEvt = {
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
      };
    } else {
      sundayEvt.time = '08:00 - 13:00 CAT';
      sundayEvt.is_permanent = true;
    }

    // Ensure Wednesday permanent service is present
    let wednesdayEvt = list.find(e => e.id === 'evt_wednesday');
    if (!wednesdayEvt) {
      wednesdayEvt = {
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
      };
    } else {
      wednesdayEvt.time = '17:00 - 20:00 CAT';
      wednesdayEvt.is_permanent = true;
    }

    // Keep other events
    const otherEvents = list.filter(e => e.id !== 'evt_sunday' && e.id !== 'evt_wednesday');

    // Always anchor Sunday and Wednesday at the very top!
    const guaranteedEvents = [sundayEvt, wednesdayEvt, ...otherEvents];
    setLocal(KEYS.EVENTS, guaranteedEvents);
    return guaranteedEvents;
  }

  static updateEvent(eventId: string, updated: Partial<ChurchEvent>): boolean {
    const events = this.getEvents();
    const evt = events.find(e => e.id === eventId);
    if (!evt) return false;
    Object.assign(evt, updated);
    setLocal(KEYS.EVENTS, events);
    return true;
  }

  static toggleEventRsvp(eventId: string): boolean {
    const events = this.getEvents();
    const evt = events.find(e => e.id === eventId);
    if (evt) {
      evt.user_rsvpd = !evt.user_rsvpd;
      evt.rsvp_count = (evt.rsvp_count || 0) + (evt.user_rsvpd ? 1 : -1);
      setLocal(KEYS.EVENTS, events);
      return evt.user_rsvpd;
    }
    return false;
  }

  static addEvent(event: ChurchEvent): void {
    const events = this.getEvents();
    events.push(event);
    setLocal(KEYS.EVENTS, events);
  }

  // Pastor Location & Church Directions Requests
  static getPastorLocationRequests(): PastorLocationRequest[] {
    return getLocal<PastorLocationRequest[]>(KEYS.PASTOR_LOCATION_REQUESTS, [
      {
        id: 'req_seed_1',
        user_id: 'usr_tinashe',
        user_name: 'Tinashe Chikwava',
        user_location: 'Bulawayo (Traveling to Harare)',
        user_phone: '0712345678',
        event_id: 'evt_sunday',
        event_title: 'Sunday Glorious Service',
        event_time: '08:00 - 13:00 CAT',
        destination: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'pending'
      }
    ]);
  }

  static sendPastorLocationRequest(params: {
    user: User;
    eventId: string;
    eventTitle: string;
    eventTime: string;
  }): PastorLocationRequest {
    const requests = this.getPastorLocationRequests();
    const newReq: PastorLocationRequest = {
      id: `req_loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: params.user.id,
      user_name: params.user.full_name,
      user_location: params.user.location || 'Harare',
      user_phone: params.user.phone || '0780000000',
      user_email: (params.user as any).email || undefined,
      event_id: params.eventId,
      event_title: params.eventTitle,
      event_time: params.eventTime,
      destination: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    requests.unshift(newReq);
    setLocal(KEYS.PASTOR_LOCATION_REQUESTS, requests);

    // Also notify user in App Notifications
    this.addAppNotification({
      type: 'broadcast',
      actor_id: 'pastor_office',
      actor_name: "Apostle Joe Daniels' Pastoral Office",
      title: `Directions Request Received: ${params.eventTitle}`,
      message: `We received your request for directions to ${params.eventTitle} from ${params.user.location || 'your area'}. A pastoral minister will reach out to you at ${params.user.phone || 'your phone number'}.`
    });

    return newReq;
  }

  static markPastorLocationRequestDone(reqId: string): void {
    const requests = this.getPastorLocationRequests();
    const target = requests.find(r => r.id === reqId);
    if (target) {
      target.status = 'directions_sent';
      setLocal(KEYS.PASTOR_LOCATION_REQUESTS, requests);
    }
  }

  // Go Virtual Notification
  static setEventVirtualReminder(eventTitle: string, user: User): void {
    this.addAppNotification({
      type: 'broadcast',
      actor_id: 'church_media',
      actor_name: 'Gateway Sanctuary Live',
      title: `Virtual Stream Reminder: ${eventTitle}`,
      message: 'When the service starts and is online you can stream the service, The stream will be available on that streaming float.'
    });
  }

  // Real Streamers Online Count (Realtime connected viewers)
  static getOnlineStreamersCount(): number {
    const viewers = this.getStreamViewers();
    return viewers ? viewers.length : 0;
  }

  // Store & Products
  static getProducts(): Product[] {
    const rawList = getLocal<Product[]>(KEYS.PRODUCTS, MOCK_PRODUCTS);
    const existingIds = new Set(rawList.map(p => p.id));
    let updated = false;
    for (const mockP of MOCK_PRODUCTS) {
      if (!existingIds.has(mockP.id)) {
        rawList.push(mockP);
        existingIds.add(mockP.id);
        updated = true;
      }
    }
    // Ensure all products have initial stock quantity
    for (const p of rawList) {
      if (p.stock_quantity === undefined) {
        p.stock_quantity = 15;
        updated = true;
      }
    }
    if (updated) {
      setLocal(KEYS.PRODUCTS, rawList);
    }
    return rawList;
  }

  // Active Store Display: items marked out-of-stock or 0 quantity are removed until replenished
  static getStoreAvailableProducts(): Product[] {
    const prods = this.getProducts();
    return prods.filter(p => p.in_stock !== false && (p.stock_quantity === undefined || p.stock_quantity > 0));
  }

  static addProduct(prod: Product): void {
    const prods = this.getProducts();
    prods.unshift(prod);
    setLocal(KEYS.PRODUCTS, prods);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_products_updated'));
    }
  }

  static updateProductStock(productId: string, stockDelta: number): void {
    const prods = this.getProducts();
    const p = prods.find(item => item.id === productId);
    if (p) {
      const cur = typeof p.stock_quantity === 'number' ? p.stock_quantity : 15;
      p.stock_quantity = Math.max(0, cur + stockDelta);
      if (p.stock_quantity <= 0) {
        p.in_stock = false;
      } else {
        p.in_stock = true;
      }
      setLocal(KEYS.PRODUCTS, prods);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_products_updated'));
      }
    }
  }

  // Receipts Archive - Central Real-Time Persistence
  static getReceiptsArchive(): Receipt[] {
    const defaultReceipts: Receipt[] = [
      {
        id: 'rec_init_001',
        reference: 'GCZ-RC-2026-8812',
        date: '10 Mar 2026',
        payer_name: 'Prophetess Melinda Daniels',
        payer_phone: '+263 77 188 9900',
        amount: 500,
        currency: 'USD',
        purpose: 'Altar Seed & Missions Expansion',
        payment_method: 'EcoCash Push',
        status: 'Paid',
        created_at: '2026-03-10T08:30:00Z',
        items_summary: 'Apostolic Prophetic Mission Offering'
      },
      {
        id: 'rec_init_002',
        reference: 'GCZ-ORD-2026-4419',
        date: '08 Mar 2026',
        payer_name: 'Tatenda Chirwa',
        payer_phone: '+263 77 855 6677',
        amount: 69.98,
        currency: 'USD',
        purpose: 'Kingdom Store (Apparel)',
        payment_method: 'EcoCash',
        status: 'Paid',
        created_at: '2026-03-08T14:15:00Z',
        items_summary: 'JD Collection "Make Heaven Crowded" T-Shirt (L) x1, JD Collection "Step In Faith" T-Shirt (M) x1'
      }
    ];
    return getLocal<Receipt[]>(KEYS.RECEIPTS_ARCHIVE, defaultReceipts);
  }

  static addReceipt(receipt: Receipt): void {
    const receipts = this.getReceiptsArchive();
    const exists = receipts.find(r => r.reference === receipt.reference);
    if (!exists) {
      receipts.unshift(receipt);
      setLocal(KEYS.RECEIPTS_ARCHIVE, receipts);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_receipts_updated', { detail: receipt }));
      }
      SupabaseSyncService.syncReceipt(receipt).catch(() => {});
    }
  }

  // Donations
  static getDonations(): Donation[] {
    return getLocal<DonationsList>(KEYS.DONATIONS, MOCK_DONATIONS);
  }

  static recordDonation(
    donation: Omit<Donation, 'id' | 'receipt_number' | 'created_at' | 'status'>,
    status: Donation['status'] = 'completed'
  ): Donation {
    const donations = this.getDonations();
    const newDonation: Donation = {
      ...donation,
      id: `don_${Date.now()}`,
      receipt_number: `GCZ-RC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status,
      created_at: new Date().toISOString()
    };
    donations.unshift(newDonation);
    setLocal(KEYS.DONATIONS, donations);

    if (newDonation.status === 'completed') {
      this.addReceipt({
        id: `rec_${Date.now()}`,
        reference: newDonation.receipt_number,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        payer_name: newDonation.donor_name,
        amount: newDonation.amount,
        currency: (newDonation.currency as any) || 'USD',
        purpose: newDonation.fund_type,
        payment_method: newDonation.payment_method,
        status: 'Paid',
        created_at: newDonation.created_at,
        items_summary: `${newDonation.fund_type} via ${newDonation.payment_method}`
      });
    }

    // Background sync to Supabase PostgreSQL
    SupabaseSyncService.syncDonation(newDonation).catch(err => {
      console.warn('Supabase donation sync deferred:', err);
    });
    return newDonation;
  }

  static addDonation(donation: any): Donation {
    const formatted: Omit<Donation, 'id' | 'receipt_number' | 'created_at' | 'status'> = {
      donor_name: donation.donor_name || 'Anonymous Believer',
      amount: donation.amount,
      currency: donation.currency,
      fund_type: donation.fund_type || donation.category || 'Seed Faith',
      category: donation.category,
      method: donation.method,
      phone: donation.phone,
      notes: donation.notes,
      payment_method: donation.payment_method || (donation.method === 'card' ? 'Credit Card' : 'EcoCash Push'),
      impact_tag: donation.impact_tag || 'Live Broadcast Altar Seed',
      is_anonymous: donation.is_anonymous ?? false
    };
    return this.recordDonation(formatted);
  }

  static updateDonationStatus(donationId: string, status: Donation['status']): Donation | null {
    const donations = this.getDonations();
    const donation = donations.find(item => item.id === donationId);
    if (!donation) return null;
    donation.status = status;
    setLocal(KEYS.DONATIONS, donations);
    if (status === 'completed' && !this.getReceiptsArchive().some(receipt => receipt.reference === donation.receipt_number)) {
      this.addReceipt({
        id: `rec_${Date.now()}`,
        reference: donation.receipt_number,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        payer_name: donation.donor_name,
        amount: donation.amount,
        currency: donation.currency,
        purpose: donation.fund_type,
        payment_method: donation.payment_method,
        status: 'Paid',
        created_at: new Date().toISOString(),
        items_summary: `${donation.fund_type} via ${donation.payment_method}`
      });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_donation_updated', { detail: donation }));
    }
    return donation;
  }

  static resetFinancesToZero(): void {
    setLocal(KEYS.DONATIONS, []);
    setLocal(KEYS.RECEIPTS, []);
    setLocal(KEYS.ORDERS, []);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_donations_updated'));
      window.dispatchEvent(new CustomEvent('gcz_donation_updated'));
      window.dispatchEvent(new CustomEvent('gcz_receipts_updated'));
    }
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

    // Real-time stock reduction on purchase, like a real store
    const prods = this.getProducts();
    let stockChanged = false;
    order.items.forEach(item => {
      const prod = prods.find(p => p.id === item.product.id);
      if (prod) {
        const curStock = typeof prod.stock_quantity === 'number' ? prod.stock_quantity : 15;
        const newStock = Math.max(0, curStock - item.quantity);
        prod.stock_quantity = newStock;
        if (newStock <= 0) {
          prod.in_stock = false;
        }
        stockChanged = true;
      }
    });

    if (stockChanged) {
      setLocal(KEYS.PRODUCTS, prods);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_products_updated'));
      }
    }

    // Generate formal receipt for confirmed store order
    this.addReceipt({
      id: `rec_${Date.now()}`,
      reference: newOrder.id,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      payer_name: newOrder.user_name,
      payer_phone: newOrder.user_phone,
      amount: newOrder.total_usd,
      currency: 'USD',
      purpose: `Kingdom Store Order (${newOrder.items.length} item${newOrder.items.length > 1 ? 's' : ''})`,
      payment_method: newOrder.payment_method,
      status: 'Paid',
      created_at: newOrder.created_at,
      items_summary: newOrder.items.map(i => `${i.product.name}${i.selectedSize ? ` (${i.selectedSize})` : ''} x${i.quantity}`).join(', ')
    });

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

  // Kingdom Store Cart
  static getCart(userId?: string): CartItem[] {
    const uid = userId || this.getCurrentUser()?.id || 'guest';
    const key = `${KEYS.KINGDOM_STORE_CART}_${uid}`;
    return getLocal<CartItem[]>(key, []);
  }

  static setCart(items: CartItem[], userId?: string): void;
  static setCart(userId: string | undefined, items: CartItem[]): void;
  static setCart(arg1: any, arg2?: any): void {
    let uid: string;
    let items: CartItem[];

    if (Array.isArray(arg1)) {
      items = arg1;
      uid = arg2 || this.getCurrentUser()?.id || 'guest';
    } else {
      uid = arg1 || this.getCurrentUser()?.id || 'guest';
      items = Array.isArray(arg2) ? arg2 : [];
    }

    const key = `${KEYS.KINGDOM_STORE_CART}_${uid}`;
    setLocal(key, items);
    // Also update generic key
    setLocal(KEYS.KINGDOM_STORE_CART, items);

    // Sync to Supabase in background
    if (uid !== 'guest') {
      SupabaseSyncService.syncCart(uid, items).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_cart_updated', { detail: { items, userId: uid } }));
    }
  }

  static clearCart(userId?: string): void {
    this.setCart(userId, []);
  }

  static async hydrateCartFromSupabase(userId: string): Promise<CartItem[] | null> {
    if (!userId || userId === 'guest') return null;
    try {
      const remoteItems = await SupabaseSyncService.fetchCart(userId);
      if (remoteItems) {
        const key = `${KEYS.KINGDOM_STORE_CART}_${userId}`;
        setLocal(key, remoteItems);
        setLocal(KEYS.KINGDOM_STORE_CART, remoteItems);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gcz_cart_updated', { detail: { items: remoteItems, userId } }));
        }
        return remoteItems;
      }
    } catch {
      // Ignore background network error
    }
    return null;
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

  // Notification Preferences (Live Streams, Prayer Requests, Direct Messages)
  static getNotificationSettings(userId?: string): NotificationSettings {
    const defaultSettings: NotificationSettings = {
      liveStreams: true,
      prayerRequests: true,
      directMessages: true
    };
    const key = userId ? `${KEYS.NOTIFICATION_SETTINGS}_${userId}` : KEYS.NOTIFICATION_SETTINGS;
    return getLocal<NotificationSettings>(key, defaultSettings);
  }

  static setNotificationSettings(settings: NotificationSettings, userId?: string): void {
    const key = userId ? `${KEYS.NOTIFICATION_SETTINGS}_${userId}` : KEYS.NOTIFICATION_SETTINGS;
    setLocal(key, settings);
    SupabaseSyncService.syncNotificationSettings(settings, userId).catch(err => {
      console.warn('Supabase notification settings sync notice:', err);
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_notification_settings_updated', { detail: settings }));
    }
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

    // Synchronize into user-facing App Notifications so the Bell icon rings across all connected devices in real time
    const appNotifs = this.getAppNotifications();
    const newAppNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'broadcast',
      actor_id: 'apostle_joe',
      actor_name: 'Apostle Joe Daniels',
      actor_avatar: '/assets/apostle_joe_daniels_main.jpg',
      title,
      message: body,
      target_type: title.toLowerCase().includes('live') ? 'live' : 'url',
      created_at: new Date().toISOString(),
      is_read: false
    };
    appNotifs.unshift(newAppNotif);
    setLocal(KEYS.APP_NOTIFICATIONS, appNotifs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_new_notification', { detail: newAppNotif }));
      window.dispatchEvent(new CustomEvent('gcz_notifications_updated'));
    }

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

  // DEDICATED POST LIKES TABLE PERSISTENCE
  static getPostLikesRecords(): { post_id: string; user_id: string; created_at: string }[] {
    const defaultLikes: { post_id: string; user_id: string; created_at: string }[] = [];
    MOCK_TESTIMONIES.forEach(t => {
      (t.liked_user_ids || []).forEach(uid => {
        defaultLikes.push({ post_id: t.id, user_id: uid, created_at: '2026-01-01T00:00:00Z' });
      });
    });
    const records = getLocal<{ post_id: string; user_id: string; created_at: string }[]>(KEYS.POST_LIKES_TABLE, defaultLikes);
    if (!records || records.length === 0) {
      setLocal(KEYS.POST_LIKES_TABLE, defaultLikes);
      return defaultLikes;
    }
    return records;
  }

  // Testimonies & Posts
  static getTestimonies(): Testimony[] {
    const rawList = getLocal<Testimony[]>(KEYS.TESTIMONIES, MOCK_TESTIMONIES);
    
    // Deduplicate by ID to ensure unique React keys even with stale local storage
    const seenIds = new Set<string>();
    const list: Testimony[] = [];
    let hadDuplicates = false;
    for (const t of rawList) {
      if (t && t.id && !seenIds.has(t.id)) {
        seenIds.add(t.id);
        list.push(t);
      } else {
        hadDuplicates = true;
      }
    }
    if (hadDuplicates) {
      setLocal(KEYS.TESTIMONIES, list);
    }

    const postLikes = this.getPostLikesRecords();
    const currentUser = this.getCurrentUser();
    const curUid = currentUser?.id || 'usr_guest';
    const allUsers = this.getAllUsers();
    const customAvatars = this.getPermanentCustomAvatars();

    // Synchronize likes and user identity from dedicated records so usernames and profile pictures display consistently
    list.forEach(t => {
      if (t.user_id) {
        const author = allUsers.find(u => u.id === t.user_id);
        if (author) {
          t.user_name = author.full_name;
          t.user_handle = author.handle || `@${author.full_name.toLowerCase().replace(/\s+/g, '_')}`;
          if (customAvatars[t.user_id]) {
            t.user_avatar = customAvatars[t.user_id];
          } else if (author.avatar_url) {
            t.user_avatar = author.avatar_url;
          }
        }
      }

      const likesForThisPost = postLikes.filter(l => l.post_id === t.id).map(l => l.user_id);
      const combined = Array.from(new Set([...(t.liked_user_ids || []), ...likesForThisPost]));
      t.liked_user_ids = combined;
      t.likes_count = combined.length;
      t.user_liked = combined.includes(curUid);
      t.comments_count = (t.comments || []).length;
      if (t.comments) {
        t.comments.forEach(c => {
          if (c.user_id) {
            const cAuthor = allUsers.find(u => u.id === c.user_id);
            if (cAuthor) {
              c.user_name = cAuthor.full_name;
              c.user_handle = cAuthor.handle || `@${cAuthor.full_name.toLowerCase().replace(/\s+/g, '_')}`;
              if (customAvatars[c.user_id]) {
                c.user_avatar = customAvatars[c.user_id];
              } else if (cAuthor.avatar_url) {
                c.user_avatar = cAuthor.avatar_url;
              }
            }
          }
          c.likes_count = (c.liked_user_ids || []).length;
        });
      }
    });

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
    // Remote database sync
    SupabaseSyncService.syncPost(newTest).catch(() => {});
    return newTest;
  }

  static likeTestimony(id: string, userId?: string): { user_liked: boolean; likes_count: number } {
    const list = getLocal<Testimony[]>(KEYS.TESTIMONIES, MOCK_TESTIMONIES);
    const target = list.find(t => t.id === id);
    if (!target) return { user_liked: false, likes_count: 0 };

    const currUser = this.getCurrentUser();
    const effectiveUserId = userId || currUser?.id || 'usr_guest';

    const postLikes = this.getPostLikesRecords();
    const existingIndex = postLikes.findIndex(l => l.post_id === id && l.user_id === effectiveUserId);
    const alreadyLiked = existingIndex >= 0;

    if (alreadyLiked) {
      postLikes.splice(existingIndex, 1);
    } else {
      postLikes.push({
        post_id: id,
        user_id: effectiveUserId,
        created_at: new Date().toISOString()
      });
    }
    setLocal(KEYS.POST_LIKES_TABLE, postLikes);

    const postLikers = postLikes.filter(l => l.post_id === id).map(l => l.user_id);
    target.liked_user_ids = postLikers;
    target.likes_count = postLikers.length;
    target.user_liked = !alreadyLiked;

    setLocal(KEYS.TESTIMONIES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: target }));
    }
    // Remote database reaction sync
    SupabaseSyncService.syncReaction(id, effectiveUserId, alreadyLiked ? 'unlike' : 'like').catch(() => {});
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

    // Notify the author of the post if someone else commented
    if (target.user_id && target.user_id !== author.id) {
      try {
        this.addAppNotification({
          title: `${author.full_name} commented on your post`,
          message: text.trim().slice(0, 100),
          type: 'chat',
          recipient_id: target.user_id
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gcz_post_comment_received', {
            detail: {
              postId: target.id,
              postAuthorId: target.user_id,
              postTitle: target.title || (target.text || '').slice(0, 40) || 'Your post',
              comment: newComment
            }
          }));
        }
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: target }));
    }
    // Remote database comment sync
    SupabaseSyncService.syncComment(postId, newComment).catch(() => {});
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
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: { id, deleted: true } }));
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

  // Auto-follow Super Admin and Developer on login or registration
  static autoFollowSuperAdminAndDeveloper(userId: string): void {
    if (!userId || userId === 'guest') return;

    const allUsers = this.getAllUsers();
    const newUser = allUsers.find(u => u.id === userId);
    if (!newUser) return;

    // Identify all super admins and lead developer accounts
    const leaders = allUsers.filter(u => 
      u.id !== userId && (
        u.role === 'super_admin' || 
        u.role === 'developer' || 
        u.id === 'usr_apostle_joe' || 
        u.id === 'usr_prophetess_melinda' || 
        u.id === 'usr_pastor_easter' || 
        u.id === 'usr_developer' || 
        u.phone === '0780699988'
      )
    );

    const records = this.getUserFollowsRecords();
    const followingKey = `following_list_${userId}`;
    const currentFollowing = getLocal<string[]>(followingKey, []);
    let changed = false;

    leaders.forEach(leader => {
      const alreadyInRecords = records.some(
        r => r.follower_id === userId && (r.following_id === leader.id || (leader.role === 'super_admin' && r.following_id === 'usr_apostle_joe'))
      );

      if (!alreadyInRecords) {
        records.push({
          follower_id: userId,
          following_id: leader.id,
          created_at: new Date().toISOString()
        });
        changed = true;

        // Interactive Notification dispatched to leader
        this.addAppNotification({
          type: 'follow',
          actor_id: newUser.id,
          actor_name: newUser.full_name,
          actor_avatar: newUser.avatar_url,
          title: 'New Disciple / Follower',
          message: `${newUser.full_name} (@${newUser.handle?.replace('@', '') || newUser.phone}) joined Gateway Connect and is now following you.`,
          recipient_id: leader.id,
          link_tab: 'profile',
          meta_id: newUser.id
        });

        // Sync to Supabase in background
        SupabaseSyncService.syncFollowState(userId, leader.id, true).catch(() => {});
      }

      if (!currentFollowing.includes(leader.id)) {
        currentFollowing.push(leader.id);
        changed = true;
      }
    });

    if (changed) {
      setLocal(KEYS.USER_FOLLOWS_TABLE, records);
      setLocal(followingKey, currentFollowing);

      // Recalculate followers count for all affected leaders
      leaders.forEach(leader => {
        const exactFollowers = records.filter(
          r => r.following_id === leader.id || (leader.role === 'super_admin' && r.following_id === 'usr_apostle_joe')
        ).length;
        leader.followers_count = exactFollowers;
      });

      // Recalculate following count for new user
      const exactFollowing = records.filter(r => r.follower_id === userId).length;
      newUser.following_count = exactFollowing;

      setLocal(KEYS.ALL_USERS, allUsers);

      const cur = this.getCurrentUser();
      if (cur && cur.id === userId) {
        cur.following_count = exactFollowing;
        this.setCurrentUser(cur);
      }

      // Dispatch realtime events across components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_follow_updated', { detail: { userId } }));
        window.dispatchEvent(new CustomEvent('gcz_user_profile_updated'));
        window.dispatchEvent(new CustomEvent('gcz_notifications_updated'));
      }
    }
  }

  // Auth: Login & Signup with strict 1 Number Per Account & Unique Username enforcement
  static login(phoneOrIdentifier: string, password?: string): { success: boolean; user?: User; error?: string } {
    const users = this.getAllUsers();
    const query = phoneOrIdentifier.trim();
    const queryClean = query.startsWith('@') ? query.slice(1).toLowerCase() : query.toLowerCase();
    
    // Find user by phone number OR by username (@handle)
    const found = users.find(u => 
      arePhoneNumbersEqual(u.phone, query) || 
      (u.handle && (
        u.handle.toLowerCase() === query.toLowerCase() || 
        u.handle.toLowerCase() === `@${queryClean}` || 
        u.handle.toLowerCase().replace('@', '') === queryClean
      ))
    );
    
    if (!found) {
      return { 
        success: false, 
        error: `No account found for "${phoneOrIdentifier}". Please enter your registered phone number or username (@handle), or sign up.` 
      };
    }

    if (found.is_banned) {
      return { 
        success: false, 
        error: `Account suspended: ${found.ban_reason || 'Community guidelines violation'}. You can submit an appeal to the Developer Desk.` 
      };
    }

    // Validate password
    if (found.password && password && found.password.trim() !== password.trim()) {
      return { 
        success: false, 
        error: `Incorrect password for ${found.full_name}. Please verify credentials or request a password reset.` 
      };
    }

    // Auto-follow Super Admin and Developer
    this.autoFollowSuperAdminAndDeveloper(found.id);
    this.setCurrentUser(found);
    return { success: true, user: found };
  }

  static signup(
    fullName: string, 
    phone: string, 
    password: string, 
    location?: string,
    referralCode?: string,
    chosenHandle?: string,
    dateOfBirth?: string,
    gender?: 'male' | 'female' | 'other'
  ): { success: boolean; user?: User; error?: string } {
    const users = this.getAllUsers();
    
    // Strict 1 Number Per Account Rule
    const existing = users.find(u => arePhoneNumbersEqual(u.phone, phone));
    if (existing) {
      return {
        success: false,
        error: `An account is already registered with mobile number ${phone}. Only 1 account is permitted per phone number. Please sign in or request a password reset.`
      };
    }

    // Enforce 1 unique handle per user to prevent fraud
    let handle = chosenHandle?.trim();
    if (!handle) {
      handle = `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    } else if (!handle.startsWith('@')) {
      handle = `@${handle.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    }
    
    // If handle already exists, append numeric suffix to guarantee uniqueness
    if (users.some(u => u.handle && u.handle.toLowerCase() === handle.toLowerCase())) {
      handle = `${handle}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const isDevPhone = arePhoneNumbersEqual(phone, '0780699988');
    const role: UserRole = isDevPhone ? 'developer' : 'member';
    const badge: BadgeType = isDevPhone ? 'gold' : 'none';
    const isVerified = isDevPhone;
    const city = location?.trim() || 'Harare';

    const newUser: User = {
      id: `usr_${Date.now()}`,
      phone: phone.trim(),
      password: password.trim() || 'juice2026',
      full_name: fullName.trim(),
      handle,
      role,
      badge_type: badge,
      location: city,
      city_location: city,
      cell_group: 'Central Fellowship',
      date_of_birth: dateOfBirth?.trim(),
      gender,
      referral_code: referralCode?.trim(),
      member_id: `GCZ-${role === 'developer' ? 'DEV' : 'MEM'}-${Math.floor(1000 + Math.random() * 9000)}`,
      is_verified: isVerified,
      created_at: new Date().toISOString(),
      saved_verses: ['John 1:1', 'Isaiah 40:31'],
      followers_count: 0,
      following_count: 2
    };

    this.saveUser(newUser);
    this.autoFollowSuperAdminAndDeveloper(newUser.id);
    this.setCurrentUser(newUser);

    // Automatic Group Assignment based on Age & Sex (Ignite Worship is joined on your own)
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }

        const isMale = gender === 'male';
        const isFemale = gender === 'female';

        // 1. Below 45 -> automatically added to youth group "Gymstars Foundation"
        if (age < 45) {
          this.joinChatGroup('group_gymstars_foundation', newUser.id, undefined, true);
        }

        // 2. Over 30 and men -> automatically added to men's group "Pride Of Lions"
        if (age > 30 && isMale) {
          this.joinChatGroup('group_pride_of_lions', newUser.id, undefined, true);
        }

        // 3. Over 30 and women -> automatically added to women's group "Passion ladies"
        if (age > 30 && isFemale) {
          this.joinChatGroup('group_passion_ladies', newUser.id, undefined, true);
        }
      }
    }

    return { success: true, user: newUser };
  }

  // User Password Change Feature
  static changePassword(userId: string, currentPassword: string, newPassword: string): { success: boolean; error?: string } {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }
    if (user.password && user.password.trim() !== currentPassword.trim()) {
      return { success: false, error: 'Current password does not match.' };
    }
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }
    user.password = newPassword.trim();
    this.saveUser(user);
    return { success: true };
  }

  // Supabase Config
  static getSupabaseConfig(): { url: string; anonKey: string; isLiveConnected: boolean } {
    return getLocal(KEYS.SUPABASE_CONFIG, {
      url: CONFIG.SUPABASE_URL,
      anonKey: CONFIG.SUPABASE_ANON_KEY,
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
    const saved = getLocal<Partial<PaynowConfig> | null>(KEYS.PAYNOW_CONFIG, null);
    const integrationId = saved?.integrationId || CONFIG.PAYNOW_INTEGRATION_ID;
    const integrationKey = saved?.integrationKey || CONFIG.PAYNOW_INTEGRATION_KEY;
    const merchantEmail = saved?.merchantEmail || CONFIG.PAYNOW_MERCHANT_EMAIL;

    return {
      integrationId,
      integrationKey,
      isLive: saved?.isLive !== undefined ? saved.isLive : true,
      merchantEmail,
      isConfigured: Boolean(integrationId && integrationKey),
      ...(saved || {})
    } as PaynowConfig;
  }

  static setPaynowConfig(config: PaynowConfig): void {
    setLocal(KEYS.PAYNOW_CONFIG, config);
  }

  // Theme Management (Dark & Light Mode)
  static getTheme(): 'dark' | 'light' {
    return getLocal<'dark' | 'light'>(KEYS.THEME, 'dark');
  }

  static setTheme(theme: 'dark' | 'light'): void {
    setLocal(KEYS.THEME, theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
    window.dispatchEvent(new CustomEvent('gcz_theme_changed', { detail: { theme } }));
  }

  static toggleTheme(): 'dark' | 'light' {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  static initTheme(): 'dark' | 'light' {
    const theme = this.getTheme();
    this.setTheme(theme);
    return theme;
  }

  // Developer God Mode: Account Bans & Security
  static getBannedUsers(): Record<string, { banned_at: string; reason: string; banned_by?: string }> {
    return getLocal<Record<string, { banned_at: string; reason: string; banned_by?: string }>>(KEYS.BANNED_USERS, {});
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_banned_users_updated', { detail: map }));
      window.dispatchEvent(new CustomEvent('gcz_user_banned_broadcast', { detail: { phone: userIdOrPhone, reason } }));
      window.dispatchEvent(new CustomEvent('gcz_user_profile_updated'));
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_banned_users_updated', { detail: map }));
      window.dispatchEvent(new CustomEvent('gcz_user_unbanned_broadcast', { detail: { phone: userIdOrPhone } }));
      window.dispatchEvent(new CustomEvent('gcz_user_profile_updated'));
    }
  }

  static banAllUsers(reason: string = 'Administrative Emergency Maintenance / Account Lockdown'): void {
    const allUsers = this.getAllUsers();
    const map = this.getBannedUsers();
    allUsers.forEach(u => {
      if (u.role !== 'developer' && u.role !== 'super_admin' && !u.full_name.toLowerCase().includes('daniels')) {
        map[u.id] = { banned_at: new Date().toISOString(), reason };
        u.is_banned = true;
        u.ban_reason = reason;
      }
    });
    setLocal(KEYS.BANNED_USERS, map);
    setLocal(KEYS.ALL_USERS, allUsers);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_banned_users_updated', { detail: map }));
      window.dispatchEvent(new CustomEvent('gcz_users_synced', { detail: allUsers }));
      window.dispatchEvent(new CustomEvent('gcz_user_banned_broadcast', { detail: { phone: 'all', reason } }));
    }
  }

  static unbanAllUsers(): void {
    const allUsers = this.getAllUsers();
    allUsers.forEach(u => {
      u.is_banned = false;
      u.ban_reason = undefined;
    });
    setLocal(KEYS.BANNED_USERS, {});
    setLocal(KEYS.ALL_USERS, allUsers);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_banned_users_updated', { detail: {} }));
      window.dispatchEvent(new CustomEvent('gcz_users_synced', { detail: allUsers }));
      window.dispatchEvent(new CustomEvent('gcz_user_unbanned_broadcast', { detail: { phone: 'all' } }));
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_unban_appeals_updated', { detail: list }));
    }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_unban_appeals_updated', { detail: list }));
      }
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_password_requests_updated', { detail: list }));
    }
    return req;
  }

  static resolvePasswordResetRequest(id: string): void {
    const list = this.getPasswordResetRequests();
    const item = list.find(r => r.id === id);
    if (item) {
      item.status = 'resolved';
      setLocal(KEYS.PASSWORD_RESETS, list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_password_requests_updated', { detail: list }));
      }
    }
  }

  static updateUserPassword(phoneOrUserId: string, newPass: string): boolean {
    const allUsers = this.getAllUsers();
    const u = allUsers.find(user => user.id === phoneOrUserId || user.phone === phoneOrUserId);
    if (u) {
      u.password = newPass;
      this.saveUser(u);
      return true;
    }
    return false;
  }

  // 24-HOUR COMMUNITY STORIES (WhatsApp / Instagram Status style) - REAL-TIME ONLY
  static getActiveStories(): CommunityStory[] {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    
    // Purge fake mock stories (story_init_*) so ONLY real user stories are kept
    const stored = getLocal<CommunityStory[]>(KEYS.COMMUNITY_STORIES, []);
    const cleanRealStories = stored.filter(s => s && s.id && !s.id.startsWith('story_init_'));

    // Filter strictly to stories created within the last 24 hours!
    const active = cleanRealStories.filter(s => {
      const age = now - new Date(s.created_at).getTime();
      return age >= 0 && age < TWENTY_FOUR_HOURS_MS;
    });

    if (active.length !== stored.length) {
      setLocal(KEYS.COMMUNITY_STORIES, active);
    }
    return active;
  }

  // Smart Social Sorting: Followed users > Verified users > High follower count > Recency
  static getSortedStories(viewerId?: string): CommunityStory[] {
    const stories = this.getActiveStories();
    if (stories.length === 0) return [];

    const followsMap = this.getUserFollowsMap();
    const followingIds = viewerId && followsMap[viewerId] ? followsMap[viewerId] : [];
    const allUsers = this.getAllUsers();
    const userMap = new Map<string, User>();
    allUsers.forEach(u => userMap.set(u.id, u));

    return [...stories].sort((a, b) => {
      const aUser = userMap.get(a.user_id);
      const bUser = userMap.get(b.user_id);

      let aScore = 0;
      let bScore = 0;

      // 1. Stories by people you follow appear first (+1000)
      if (followingIds.includes(a.user_id)) aScore += 1000;
      if (followingIds.includes(b.user_id)) bScore += 1000;

      // 2. Verified badges (+500 for gold, +300 for blue, +200 for silver)
      if (a.badge_type === 'gold' || aUser?.badge_type === 'gold') aScore += 500;
      else if (a.badge_type === 'blue' || aUser?.badge_type === 'blue') aScore += 300;
      else if (a.badge_type === 'silver' || aUser?.badge_type === 'silver') aScore += 200;

      if (b.badge_type === 'gold' || bUser?.badge_type === 'gold') bScore += 500;
      else if (b.badge_type === 'blue' || bUser?.badge_type === 'blue') bScore += 300;
      else if (b.badge_type === 'silver' || bUser?.badge_type === 'silver') bScore += 200;

      // 3. User follower count bonus
      aScore += (aUser?.followers_count || 0);
      bScore += (bUser?.followers_count || 0);

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      // 4. Most recent story
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  static addStory(story: Omit<CommunityStory, 'id' | 'created_at'>): CommunityStory {
    const list = this.getActiveStories();
    const newStory: CommunityStory = {
      ...story,
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newStory);
    setLocal(KEYS.COMMUNITY_STORIES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_story_updated', { detail: newStory }));
    }
    // Remote database sync
    SupabaseSyncService.syncStory(newStory).catch(() => {});
    return newStory;
  }

  // REAL STORY LIKES TRACKING (Recorded just like post likes)
  static getStoryLikes(storyId: string): string[] {
    const map = getLocal<Record<string, string[]>>(KEYS.STORY_LIKES, {});
    return map[storyId] || [];
  }

  static hasUserLikedStory(storyId: string, userId: string): boolean {
    if (!storyId || !userId) return false;
    const likes = this.getStoryLikes(storyId);
    return likes.includes(userId);
  }

  static toggleStoryLike(storyId: string, userId: string): { isLiked: boolean; count: number } {
    if (!storyId || !userId) return { isLiked: false, count: 0 };
    const map = getLocal<Record<string, string[]>>(KEYS.STORY_LIKES, {});
    const likes = map[storyId] || [];
    const idx = likes.indexOf(userId);
    let isLiked = false;

    if (idx >= 0) {
      likes.splice(idx, 1);
      isLiked = false;
    } else {
      likes.push(userId);
      isLiked = true;
    }
    map[storyId] = likes;
    setLocal(KEYS.STORY_LIKES, map);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_story_like_updated', {
        detail: { storyId, userId, isLiked, count: likes.length }
      }));
    }
    return { isLiked, count: likes.length };
  }

  // USER LAST SEEN HELPER (WhatsApp Style, except Developer)
  static getUserLastSeen(user: User): string {
    if (!user) return 'offline';
    // Developer is strictly exempt from last seen
    if (user.role === 'developer' || user.phone === '0780699988') {
      return '';
    }

    // Check if user is actively watching live stream or in viewers
    const viewers = this.getStreamViewers();
    if (viewers.some(v => v.userId === user.id || arePhoneNumbersEqual(v.phone, user.phone))) {
      return 'online';
    }

    // Calculate a consistent, realistic last seen time for this believer
    const hash = (user.id || user.phone).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const minsAgo = (hash % 38) + 2;
    if (minsAgo <= 4) return 'online';

    const time = new Date(Date.now() - minsAgo * 60 * 1000);
    const hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `last seen today at ${displayHour}:${minutes} ${ampm}`;
  }

  // INSTAGRAM-STYLE FOLLOW / UNFOLLOW SYSTEM
  // Mapping: userId -> string[] (array of userIds this user follows)
  static getUserFollowsMap(): Record<string, string[]> {
    return getLocal<Record<string, string[]>>(KEYS.USER_FOLLOWS, {
      'usr_dev': ['usr_daniels', 'usr_pastor_grace', 'usr_kuda'],
      'usr_daniels': ['usr_pastor_grace'],
      'usr_pastor_grace': ['usr_daniels']
    });
  }

  static isFollowingUser(followerId: string, targetUserId: string): boolean {
    if (!followerId || !targetUserId) return false;
    const followingList = this.getFollowingList(followerId);
    return followingList.includes(targetUserId);
  }

  static getUserFollowersCount(userId: string): number {
    const list = this.getFollowersList(userId);
    return list.length;
  }

  static getUserFollowingCount(userId: string): number {
    const list = this.getFollowingList(userId);
    return list.length;
  }

  // DIRECT MESSAGING (DM) SYSTEM - INSTAGRAM STYLE
  static getAllDirectMessages(): DirectMessage[] {
    return getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
  }

  static getDirectMessages(userAId: string, userBId: string, currentUserId?: string): DirectMessage[] {
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, [
      {
        id: 'dm_init_1',
        sender_id: userBId,
        receiver_id: userAId,
        text: 'Grace and peace! Welcome to Gateway Connect. How can I stand in agreement with you today in prayer? 🙏',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: true
      }
    ]);
    return all.filter(m => {
      const matchThread = (m.sender_id === userAId && m.receiver_id === userBId) ||
                          (m.sender_id === userBId && m.receiver_id === userAId);
      if (!matchThread) return false;
      if (currentUserId && m.deleted_for_users && m.deleted_for_users.includes(currentUserId)) {
        return false;
      }
      return true;
    });
  }

  static sendDirectMessage(senderId: string, receiverId: string, text: string, replyTo?: { id: string; sender_name: string; text: string }): DirectMessage {
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender_id: senderId,
      receiver_id: receiverId,
      text: text.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      reply_to: replyTo
    };
    all.push(newMsg);
    setLocal(KEYS.DIRECT_MESSAGES, all);

    SupabaseSyncService.syncDirectMessage(newMsg).catch(() => {});

    // Create real-time notification alert for message recipient
    try {
      const allUsers = this.getAllUsers();
      const sender = allUsers.find(u => u.id === senderId || arePhoneNumbersEqual(u.phone, senderId));
      const senderName = sender?.full_name || 'A believer';
      this.addAppNotification({
        title: `Message from ${senderName}`,
        message: text.trim().slice(0, 100),
        type: 'chat',
        recipient_id: receiverId
      });
    } catch {
      // safe fallback
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_direct_messages_updated', { detail: newMsg }));
      window.dispatchEvent(new CustomEvent('gcz_dms_updated'));
    }

    return newMsg;
  }

  static receiveIncomingDirectMessage(message: DirectMessage): void {
    if (!message) return;
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    const exists = all.some(m => m.id === message.id);
    if (!exists) {
      all.push(message);
      setLocal(KEYS.DIRECT_MESSAGES, all);

      const current = this.getCurrentUser();
      if (current && (current.id === message.receiver_id || arePhoneNumbersEqual(current.phone, message.receiver_id))) {
        try {
          const allUsers = this.getAllUsers();
          const sender = allUsers.find(u => u.id === message.sender_id || arePhoneNumbersEqual(u.phone, message.sender_id));
          const senderName = sender?.full_name || 'A believer';
          this.addAppNotification({
            title: `Message from ${senderName}`,
            message: (message.text || '').trim().slice(0, 100),
            type: 'chat',
            recipient_id: current.id
          });
        } catch {
          // safe fallback
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_direct_messages_updated', { detail: message }));
        window.dispatchEvent(new CustomEvent('gcz_dms_updated'));
      }
    }
  }

  static markMessagesAsRead(senderId: string, currentUserId: string): void {
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    let updated = false;
    for (const msg of all) {
      if (msg.sender_id === senderId && msg.receiver_id === currentUserId && !msg.is_read) {
        msg.is_read = true;
        updated = true;
      }
    }
    if (updated) {
      setLocal(KEYS.DIRECT_MESSAGES, all);
    }
  }

  static getAllDirectMessageThreads(currentUserId: string): DmThread[] {
    const allMsgs = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    const allUsers = this.getAllUsers();
    const threadMap = new Map<string, { lastMsg: DirectMessage; unread: number }>();

    allMsgs.forEach(msg => {
      let otherId: string | null = null;
      if (msg.sender_id === currentUserId) {
        otherId = msg.receiver_id;
      } else if (msg.receiver_id === currentUserId) {
        otherId = msg.sender_id;
      }
      if (otherId) {
        const existing = threadMap.get(otherId);
        const isNewer = !existing || new Date(msg.created_at) > new Date(existing.lastMsg.created_at);
        const isUnread = !msg.is_read && msg.receiver_id === currentUserId;
        if (isNewer) {
          threadMap.set(otherId, {
            lastMsg: msg,
            unread: (existing?.unread || 0) + (isUnread ? 1 : 0)
          });
        } else if (isUnread && existing) {
          existing.unread += 1;
        }
      }
    });

    // Seed default conversations with Apostle Joe Daniels and Lead Developer if empty
    ['usr_apostle_joe', 'usr_developer'].forEach(id => {
      if (id !== currentUserId && !threadMap.has(id)) {
        threadMap.set(id, {
          lastMsg: {
            id: `dm_welcome_${id}`,
            sender_id: id,
            receiver_id: currentUserId,
            text: id === 'usr_apostle_joe'
              ? 'Peace be unto you! Welcome to the Altar of Acceleration. Send your prayer request anytime.'
              : 'Gateway Developer Desk: Systems operational. How can tech ministry serve you today?',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            is_read: true
          },
          unread: 0
        });
      }
    });

    const threads: DmThread[] = [];
    threadMap.forEach((val, otherId) => {
      const user = allUsers.find(u => u.id === otherId);
      if (user) {
        threads.push({
          other_user: user,
          last_message: val.lastMsg,
          unread_count: val.unread
        });
      }
    });

    return threads.sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());
  }

  // LIVE SERMON NOTIFICATION & STREAMING MANAGEMENT
  static getLiveSermonStatus(): { isLive: boolean; title: string; sermonId: string; viewerCount: number; streamUrl?: string } {
    const savedUrl = this.getLiveStreamUrl();
    const status = getLocal(KEYS.LIVE_SERMON, {
      isLive: true,
      title: 'Church & Politics (Controversial Issues) • Apostle Joe Daniels Live',
      sermonId: 'sermon_church_politics',
      viewerCount: 1429,
      streamUrl: savedUrl
    });
    if (!status.streamUrl) {
      status.streamUrl = savedUrl;
    }
    return status;
  }

  static setLiveSermonStatus(status: { isLive: boolean; title: string; sermonId: string; viewerCount: number; streamUrl?: string }): void {
    setLocal(KEYS.LIVE_SERMON, status);
    if (status.streamUrl) {
      this.setLiveStreamUrl(status.streamUrl);
      SupabaseSyncService.syncStreamUrl(status.streamUrl).catch(() => {});
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_live_status_updated', { detail: status }));
    }
  }

  static getStreamViewers(): LiveStreamViewer[] {
    const raw = getLocal<LiveStreamViewer[]>(KEYS.STREAM_VIEWERS, []);
    // Purge any legacy mock seeds ('u1', 'u2', etc.)
    const clean = raw.filter(v => v && v.user_id && !/^u\d+$/.test(v.user_id));
    if (clean.length !== raw.length) {
      setLocal(KEYS.STREAM_VIEWERS, clean);
    }
    return clean;
  }

  // Record streamer when watched for 10+ seconds, capturing login & profile details
  static recordStreamer(user: User, sessionTitle?: string): LiveStreamViewer {
    const viewers = this.getStreamViewers();
    const existingIdx = viewers.findIndex(v => v.user_id === user.id || (user.phone && v.phone === user.phone));
    const viewerRecord: LiveStreamViewer = {
      user_id: user.id,
      full_name: user.full_name,
      user_name: user.handle || user.full_name,
      phone: user.phone,
      handle: user.handle,
      city: user.location || user.city_location || 'Harare',
      avatar_url: user.avatar_url,
      device: typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      login_details: `${user.phone || 'Phone'} • Role: ${user.role} • ID: ${user.member_id || user.id.substring(0, 8)}`,
      joined_at: new Date().toISOString(),
      is_active: true
    };

    if (existingIdx >= 0) {
      viewers[existingIdx] = viewerRecord;
    } else {
      viewers.push(viewerRecord);
    }
    setLocal(KEYS.STREAM_VIEWERS, viewers);

    // Record into persistent congregation stream attendees registry
    this.recordStreamAttendance(user, sessionTitle);

    // Realtime broadcast to all connected devices so dashboards update instantly
    SupabaseSyncService.syncStreamerJoined(viewerRecord).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_stream_viewers_updated', { detail: viewers }));
      window.dispatchEvent(new CustomEvent('gcz_stream_viewer_joined', { detail: viewerRecord }));
      window.dispatchEvent(new CustomEvent('gcz_stream_attendance_updated', { detail: this.getStreamAttendanceHistory() }));
    }
    return viewerRecord;
  }

  static joinLiveStream(user: User, sessionTitle?: string): void {
    this.recordStreamer(user, sessionTitle);
  }

  static leaveLiveStream(userId: string): void {
    const viewers = this.getStreamViewers().filter(v => v.user_id !== userId);
    setLocal(KEYS.STREAM_VIEWERS, viewers);

    // Update ended_at in attendance history
    const history = this.getStreamAttendanceHistory();
    const target = history.find(h => h.user_id === userId && h.status === 'active');
    if (target) {
      target.ended_at = new Date().toISOString();
      target.status = 'completed';
      setLocal(KEYS.STREAM_ATTENDANCE_HISTORY, history);
    }

    // Broadcast immediate count drop to all devices in realtime
    SupabaseSyncService.syncStreamerLeft(userId).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_stream_viewers_updated', { detail: viewers }));
      window.dispatchEvent(new CustomEvent('gcz_stream_viewer_left', { detail: { userId } }));
      window.dispatchEvent(new CustomEvent('gcz_stream_attendance_updated', { detail: history }));
    }
  }

  // Persistent Congregation Stream Attendees Registry (Kept in database for future follow-up & congregation records)
  static getStreamAttendanceHistory(): StreamAttendanceRecord[] {
    return getLocal<StreamAttendanceRecord[]>(KEYS.STREAM_ATTENDANCE_HISTORY, [
      {
        id: 'att_seed_1',
        user_id: 'usr_tinashe',
        user_name: 'Tinashe Chikwava',
        user_phone: '0712345678',
        user_handle: '@tinashe_zim',
        city: 'Bulawayo',
        session_title: 'Supernatural Acceleration & Prophetic Turnaround',
        joined_at: new Date(Date.now() - 3600000).toISOString(),
        ended_at: new Date(Date.now() - 600000).toISOString(),
        status: 'completed'
      },
      {
        id: 'att_seed_2',
        user_id: 'usr_chipo',
        user_name: 'Chipo Ruvimbo Mandaza',
        user_phone: '0774334455',
        user_handle: '@chipo_mandaza',
        city: 'Harare',
        session_title: 'Supernatural Acceleration & Prophetic Turnaround',
        joined_at: new Date(Date.now() - 3600000).toISOString(),
        ended_at: new Date(Date.now() - 600000).toISOString(),
        status: 'completed'
      },
      {
        id: 'att_seed_3',
        user_id: 'usr_farai',
        user_name: 'Farai Takawira',
        user_phone: '0733221100',
        user_handle: '@farai_taka',
        city: 'Chitungwiza',
        session_title: 'Supernatural Acceleration & Prophetic Turnaround',
        joined_at: new Date(Date.now() - 3600000).toISOString(),
        ended_at: new Date(Date.now() - 600000).toISOString(),
        status: 'completed'
      },
      {
        id: 'att_seed_4',
        user_id: 'usr_kuda',
        user_name: 'Kudakwashe Sibanda',
        user_phone: '0782112244',
        user_handle: '@kuda_sibanda',
        city: 'Harare',
        session_title: 'Supernatural Acceleration & Prophetic Turnaround',
        joined_at: new Date(Date.now() - 3600000).toISOString(),
        ended_at: new Date(Date.now() - 600000).toISOString(),
        status: 'completed'
      },
      {
        id: 'att_seed_5',
        user_id: 'usr_tatenda',
        user_name: 'Tatenda Blessing Chirwa',
        user_phone: '0778556677',
        user_handle: '@tatenda_chirwa',
        city: 'Marondera',
        session_title: 'Supernatural Acceleration & Prophetic Turnaround',
        joined_at: new Date(Date.now() - 3600000).toISOString(),
        ended_at: new Date(Date.now() - 600000).toISOString(),
        status: 'completed'
      }
    ]);
  }

  static recordStreamAttendance(user: User, sessionTitle?: string): void {
    const list = this.getStreamAttendanceHistory();
    const existing = list.find(r => r.user_id === user.id && r.status === 'active');
    if (!existing) {
      list.unshift({
        id: `att_${Date.now()}_${user.id}`,
        user_id: user.id,
        user_name: user.full_name,
        user_phone: user.phone || '0780000000',
        user_handle: user.handle || `@${user.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        city: user.location || 'Harare',
        session_title: sessionTitle || 'Supernatural Acceleration & Dominion Service',
        joined_at: new Date().toISOString(),
        status: 'active'
      });
      setLocal(KEYS.STREAM_ATTENDANCE_HISTORY, list);
    }
  }

  static endActiveStreamSession(): void {
    const list = this.getStreamAttendanceHistory();
    const now = new Date().toISOString();
    let updated = false;
    list.forEach(item => {
      if (item.status === 'active') {
        item.status = 'completed';
        item.ended_at = now;
        updated = true;
      }
    });
    if (updated) {
      setLocal(KEYS.STREAM_ATTENDANCE_HISTORY, list);
    }
  }

  // Social & Activity Notifications - WhatsApp-style per-account notifications
  static getAppNotifications(recipientId?: string): AppNotification[] {
    const targetUserId = recipientId || this.getCurrentUser()?.id;
    const raw = getLocal<AppNotification[]>(KEYS.APP_NOTIFICATIONS, []);
    
    // Purge any legacy fake mock notifications
    const clean = raw.filter(n => n && n.id && !n.id.startsWith('notif_1') && !n.id.startsWith('notif_2') && !n.id.startsWith('notif_3') && !n.id.startsWith('notif_4') && !n.id.startsWith('notif_5'));
    if (clean.length !== raw.length) {
      setLocal(KEYS.APP_NOTIFICATIONS, clean);
    }

    if (!targetUserId || targetUserId === 'guest') {
      return [];
    }

    // Only return notifications specifically targeted to this believer or global church announcements
    return clean.filter(n => !n.recipient_id || n.recipient_id === targetUserId);
  }

  static addAppNotification(notif: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>): void {
    const raw = getLocal<AppNotification[]>(KEYS.APP_NOTIFICATIONS, []);
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      is_read: false
    };
    raw.unshift(newNotif);
    setLocal(KEYS.APP_NOTIFICATIONS, raw);
    
    // Realtime notification sync across devices
    SupabaseSyncService.syncNotificationCreated(newNotif).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_new_notification', { detail: newNotif }));
      window.dispatchEvent(new CustomEvent('gcz_notifications_updated'));
    }
  }

  static markNotificationRead(id: string): void {
    const list = this.getAppNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.is_read = true;
      setLocal(KEYS.APP_NOTIFICATIONS, list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_notifications_updated'));
      }
    }
  }

  static markAllNotificationsRead(): void {
    const list = this.getAppNotifications();
    list.forEach(n => n.is_read = true);
    setLocal(KEYS.APP_NOTIFICATIONS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_notifications_updated'));
    }
  }

  // CONGREGATION CLUSTERING (Combines users by city; if reach 10, recorded as official Congregation)
  static getCongregationUnits(): CongregationUnit[] {
    const streamers = this.getStreamViewers();
    const allUsers = this.getAllUsers();
    
    return SUPPORTED_CITIES.map(city => {
      const cityStreamers = streamers.filter(s => 
        s.city.toLowerCase().includes(city.toLowerCase()) || 
        (city === 'Other In Zimbabwe' && !SUPPORTED_CITIES.slice(0, 10).some(c => s.city.toLowerCase().includes(c.toLowerCase())) && !s.city.toLowerCase().includes('out of'))
      );
      
      const cityMembers = allUsers.filter(u => 
        u.location && u.location.toLowerCase().includes(city.toLowerCase())
      );

      const activeCount = cityStreamers.length;
      const totalMembers = Math.max(cityMembers.length, activeCount);
      
      // If people from that city reach 10, it is recorded as a Congregation!
      const isCongregation = (activeCount >= 10) || (totalMembers >= 10);

      return {
        city,
        active_streamers: activeCount,
        total_members: totalMembers,
        is_congregation: isCongregation,
        streamers: cityStreamers
      };
    });
  }

  // DEVELOPER GODMODE CAPABILITIES (Restricted exclusively to Developer 0780699988)
  static developerPenetrateAccount(targetUserId: string): { success: boolean; user?: User; error?: string } {
    const allUsers = this.getAllUsers();
    const target = allUsers.find(u => u.id === targetUserId || arePhoneNumbersEqual(u.phone, targetUserId));
    if (!target) {
      return { success: false, error: 'Target account not found in database.' };
    }
    this.setCurrentUser(target);
    return { success: true, user: target };
  }

  static developerEditAccount(targetUserId: string, updates: Partial<User>): { success: boolean; user?: User; error?: string } {
    const allUsers = this.getAllUsers();
    const target = allUsers.find(u => u.id === targetUserId || arePhoneNumbersEqual(u.phone, targetUserId));
    if (!target) {
      return { success: false, error: 'Target account not found.' };
    }
    Object.assign(target, updates);
    this.saveUser(target);
    return { success: true, user: target };
  }

  static developerDeleteAccount(targetUserId: string): { success: boolean; error?: string } {
    let allUsers = this.getAllUsers();
    const target = allUsers.find(u => u.id === targetUserId || arePhoneNumbersEqual(u.phone, targetUserId));
    if (!target) {
      return { success: false, error: 'Target account not found.' };
    }
    if (target.role === 'super_admin') {
      return { success: false, error: 'Super Admin account is system protected and cannot be deleted.' };
    }
    allUsers = allUsers.filter(u => u.id !== target.id);
    setLocal(KEYS.ALL_USERS, allUsers);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_users_synced', { detail: allUsers }));
      window.dispatchEvent(new CustomEvent('gcz_user_profile_updated'));
    }
    return { success: true };
  }

  // God Mode Verification Badge Management (Synced to Supabase in Realtime)
  static developerSetVerificationBadge(targetUserId: string, isVerified: boolean, badgeType?: 'none' | 'blue' | 'gold' | 'silver'): { success: boolean; user?: User; error?: string } {
    const allUsers = this.getAllUsers();
    const target = allUsers.find(u => u.id === targetUserId || arePhoneNumbersEqual(u.phone, targetUserId));
    if (!target) {
      return { success: false, error: 'Target account not found in database.' };
    }
    target.is_verified = isVerified;
    target.badge_type = badgeType || (isVerified ? 'blue' : 'none');
    this.saveUser(target);

    // Sync directly to Supabase persistent table and broadcast over realtime channel
    SupabaseSyncService.syncVerificationBadge(target.id, isVerified, target.badge_type).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_user_profile_updated', { detail: target }));
    }
    return { success: true, user: target };
  }

  static developerRemoveVerificationBadge(targetUserId: string): { success: boolean; user?: User; error?: string } {
    return this.developerSetVerificationBadge(targetUserId, false, 'none');
  }

  // =========================================================================
  // LIVE STREAM URL, FACEBOOK & YOUTUBE STREAMING HELPER
  // =========================================================================
  static getLiveStreamUrl(): string {
    return getLocal<string>(KEYS.LIVE_STREAM_URL, 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP');
  }

  static setLiveStreamUrl(url: string): void {
    if (!url) return;
    const cleanUrl = url.trim();
    setLocal(KEYS.LIVE_STREAM_URL, cleanUrl);
    SupabaseSyncService.setLiveStreamUrl(cleanUrl).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_stream_url_updated', { detail: { url: cleanUrl } }));
    }
  }

  static isFacebookUrl(urlOrId?: string): boolean {
    if (!urlOrId) return false;
    const lower = urlOrId.toLowerCase();
    return (
      lower.includes('facebook.com') ||
      lower.includes('fb.watch') ||
      lower.includes('fb.com') ||
      lower.includes('facebook.net')
    );
  }

  static extractFacebookEmbedUrl(urlOrIframe?: string): { 
    embedUrl: string; 
    directUrl: string; 
    videoId?: string;
    hasNumericVideoId: boolean;
    isLivePageHub: boolean;
  } {
    if (!urlOrIframe) {
      return {
        embedUrl: '',
        directUrl: 'https://www.facebook.com',
        hasNumericVideoId: false,
        isLivePageHub: false
      };
    }

    let input = urlOrIframe.trim();

    // Check if user pasted an entire iframe snippet
    const iframeSrcMatch = input.match(/<iframe.*?src=["'](.*?)["']/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      input = iframeSrcMatch[1];
    }

    // Replace HTML entities like &amp; with &
    input = input.replace(/&amp;/g, '&');

    // If it's already a Facebook plugin iframe URL
    if (input.includes('/plugins/video.php') || input.includes('/plugins/post.php')) {
      let embedUrl = input;
      // Ensure autoplay and show_text
      if (!embedUrl.includes('show_text=')) {
        embedUrl += '&show_text=false';
      }
      if (!embedUrl.includes('autoplay=')) {
        embedUrl += '&autoplay=true';
      }

      // Try to extract original href
      let directUrl = 'https://www.facebook.com';
      let extractedVid: string | undefined;
      try {
        const urlObj = new URL(input.startsWith('http') ? input : `https:${input}`);
        const hrefParam = urlObj.searchParams.get('href');
        if (hrefParam) {
          directUrl = decodeURIComponent(hrefParam);
          const vM = directUrl.match(/[?&]v=(\d+)/) || directUrl.match(/\/(\d{8,20})/);
          if (vM && vM[1]) extractedVid = vM[1];
        }
      } catch {
        directUrl = input;
      }

      return { 
        embedUrl, 
        directUrl, 
        videoId: extractedVid,
        hasNumericVideoId: !!extractedVid,
        isLivePageHub: directUrl.toLowerCase().includes('/live') && !extractedVid
      };
    }

    // Clean tracking query params while keeping v= param
    let cleanUrl = input;
    try {
      if (cleanUrl.startsWith('http')) {
        const u = new URL(cleanUrl);
        // Normalize mobile / regional subdomains
        if (u.hostname === 'm.facebook.com' || u.hostname === 'web.facebook.com' || u.hostname === 'mobile.facebook.com') {
          u.hostname = 'www.facebook.com';
        }
        // Remove tracking params
        u.searchParams.delete('fbclid');
        u.searchParams.delete('mibextid');
        u.searchParams.delete('ref');
        u.searchParams.delete('rdid');
        u.searchParams.delete('checkpoint_src');
        u.searchParams.delete('_rdr');
        cleanUrl = u.toString();
      }
    } catch {
      // ignore
    }

    // Comprehensive videoId extraction across all Facebook URL styles
    let videoId: string | undefined;
    
    // 1. Check ?v= or &v= (e.g. /watch/?v=12345 or /watch/live/?v=12345)
    const vMatch = cleanUrl.match(/[?&]v=(\d+)/);
    if (vMatch && vMatch[1]) {
      videoId = vMatch[1];
    } else {
      // 2. Check /videos/{page_id}/{video_id} or /videos/{video_id}
      const vidPathMatch = cleanUrl.match(/\/videos\/(?:[^\/]+\/)?(\d+)/);
      if (vidPathMatch && vidPathMatch[1]) {
        videoId = vidPathMatch[1];
      } else {
        // 3. Check /reel/{id}
        const reelMatch = cleanUrl.match(/\/reel\/(\d+)/);
        if (reelMatch && reelMatch[1]) {
          videoId = reelMatch[1];
        } else {
          // 4. Check /posts/{id}
          const postMatch = cleanUrl.match(/\/posts\/(\d+)/);
          if (postMatch && postMatch[1]) {
            videoId = postMatch[1];
          } else {
            // 5. Check /share/[vrp]/{id}
            const shareMatch = cleanUrl.match(/\/share\/[vrp]\/(\d+)/);
            if (shareMatch && shareMatch[1]) {
              videoId = shareMatch[1];
            } else {
              // 6. Check /live/{id}
              const livePathMatch = cleanUrl.match(/\/live\/(\d+)/);
              if (livePathMatch && livePathMatch[1]) {
                videoId = livePathMatch[1];
              } else {
                // 7. Check story_fbid={id}
                const storyMatch = cleanUrl.match(/story_fbid=(\d+)/);
                if (storyMatch && storyMatch[1]) {
                  videoId = storyMatch[1];
                } else {
                  // 8. Standalone 8-20 digits in path
                  const numMatch = cleanUrl.match(/(?:^|\/|\?|&|=)(\d{9,20})(?:$|\/|\?|&)/);
                  if (numMatch && numMatch[1]) {
                    videoId = numMatch[1];
                  }
                }
              }
            }
          }
        }
      }
    }

    const isLivePageHub = !videoId && cleanUrl.toLowerCase().includes('/live');

    // When a video ID is detected, we construct the canonical Facebook Watch URL.
    // This is crucial because Facebook's video.php plugin rejects /share/ or /reel/ URLs with "Video Unavailable"!
    const canonicalVideoUrl = videoId 
      ? `https://www.facebook.com/watch/?v=${videoId}`
      : cleanUrl;

    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalVideoUrl)}&show_text=false&width=auto&autoplay=true`;

    return {
      embedUrl,
      directUrl: canonicalVideoUrl,
      videoId,
      hasNumericVideoId: !!videoId,
      isLivePageHub
    };
  }

  static getYoutubeEmbedUrl(videoId: string, autoplay = true): string {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: '0',
      controls: '1',
      rel: '0',
      playsinline: '1',
      enablejsapi: '1'
    });
    if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
      params.set('origin', window.location.origin);
    }
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  }

  static getStreamEmbedInfo(urlOrId?: string): StreamEmbedInfo {
    if (!urlOrId || !urlOrId.trim()) {
      const defaultYt = '-CibsaxijIk';
      return {
        platform: 'youtube',
        embedUrl: this.getYoutubeEmbedUrl(defaultYt),
        originalUrl: '',
        videoId: defaultYt,
        isFacebook: false,
        isYoutube: true
      };
    }

    const raw = urlOrId.trim();

    // Check for iframe embed pasted directly
    let target = raw;
    const iframeSrcMatch = target.match(/<iframe.*?src=["'](.*?)["']/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      target = iframeSrcMatch[1].replace(/&amp;/g, '&');
    }

    // 1. Facebook Link
    if (this.isFacebookUrl(target)) {
      const fb = this.extractFacebookEmbedUrl(target);
      return {
        platform: 'facebook',
        embedUrl: fb.embedUrl,
        originalUrl: raw,
        videoId: fb.videoId,
        isFacebook: true,
        isYoutube: false,
        facebookDirectUrl: fb.directUrl,
        hasNumericVideoId: fb.hasNumericVideoId,
        isLivePageHub: fb.isLivePageHub
      };
    }

    // 2. Direct video file (.mp4, .webm, .m3u8)
    if (/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(target)) {
      return {
        platform: 'direct',
        embedUrl: target,
        originalUrl: raw,
        isFacebook: false,
        isYoutube: false
      };
    }

    // 3. YouTube (URL or ID)
    const ytId = this.extractYoutubeId(target);
    if (ytId) {
      return {
        platform: 'youtube',
        embedUrl: this.getYoutubeEmbedUrl(ytId),
        originalUrl: raw,
        videoId: ytId,
        isFacebook: false,
        isYoutube: true
      };
    }

    // Fallback: If generic embed URL
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return {
        platform: 'custom_embed',
        embedUrl: target,
        originalUrl: raw,
        isFacebook: false,
        isYoutube: false
      };
    }

    // Fallback to default church stream
    const defaultYt = '-CibsaxijIk';
    return {
      platform: 'youtube',
      embedUrl: this.getYoutubeEmbedUrl(defaultYt),
      originalUrl: raw,
      videoId: defaultYt,
      isFacebook: false,
      isYoutube: true
    };
  }

  static extractYoutubeId(urlOrId?: string): string {
    if (!urlOrId) return '-CibsaxijIk';
    const trimmed = urlOrId.trim();

    // If it's a Facebook URL, it is NOT a YouTube ID!
    if (this.isFacebookUrl(trimmed)) {
      return '';
    }

    // If it's already an 11-char ID without slashes, query params or colons
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    // Match standard youtube url variations
    const patterns = [
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([\w-]{11})/,
      /[?&]v=([\w-]{11})/
    ];
    for (const p of patterns) {
      const match = trimmed.match(p);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If it's an unrecognized web URL, don't return the full URL as if it were an ID
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return '';
    }

    return trimmed;
  }

  // =========================================================================
  // COMMUNITY CHAT GROUPS & FOUNDATION SCHOOL MEMBERSHIP LOGIC
  // =========================================================================
  static getChatGroups(): ChatGroup[] {
    const dissolved = new Set(getLocal<string[]>(KEYS.DISSOLVED_GROUPS, []));
    let list = getLocal<ChatGroup[]>(KEYS.CHAT_GROUPS, INITIAL_CHAT_GROUPS);
    if (!list || list.length === 0) {
      const initialFiltered = INITIAL_CHAT_GROUPS.filter(g => !dissolved.has(g.id));
      setLocal(KEYS.CHAT_GROUPS, initialFiltered);
      return initialFiltered;
    }
    // Filter out any dissolved groups
    list = list.filter(g => !dissolved.has(g.id));
    // Ensure all canonical groups exist unless dissolved
    const existingIds = new Set(list.map(g => g.id));
    let changed = false;
    for (const initGrp of INITIAL_CHAT_GROUPS) {
      if (!existingIds.has(initGrp.id) && !dissolved.has(initGrp.id)) {
        list.push(initGrp);
        changed = true;
      }
    }
    if (changed) {
      setLocal(KEYS.CHAT_GROUPS, list);
    }
    return list;
  }

  static validateGroupInviteCode(rawCode: string): { status: 'valid' | 'reset' | 'invalid'; group?: ChatGroup } {
    if (!rawCode) return { status: 'invalid' };
    let code = rawCode.trim();
    if (code.includes('code=')) {
      const parts = code.split('code=');
      code = parts[1].split('&')[0];
    }
    code = code.trim();
    if (!code) return { status: 'invalid' };

    const groups = this.getChatGroups();

    // Check if active code matches
    const activeGroup = groups.find(g => g.invite_code && g.invite_code.toLowerCase() === code.toLowerCase());
    if (activeGroup) {
      if (activeGroup.is_invite_link_active === false) {
        return { status: 'reset', group: activeGroup };
      }
      return { status: 'valid', group: activeGroup };
    }

    // Check if revoked/reset code matches
    const revokedGroup = groups.find(g => 
      g.revoked_invite_codes && 
      g.revoked_invite_codes.some(rc => rc.toLowerCase() === code.toLowerCase())
    );
    if (revokedGroup) {
      return { status: 'reset', group: revokedGroup };
    }

    return { status: 'invalid' };
  }

  static resetGroupInviteCode(groupId: string): { success: boolean; newCode?: string; message: string; group?: ChatGroup } {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return { success: false, message: 'Group not found' };

    if (!grp.revoked_invite_codes) grp.revoked_invite_codes = [];
    if (grp.invite_code && !grp.revoked_invite_codes.includes(grp.invite_code)) {
      grp.revoked_invite_codes.push(grp.invite_code);
    }

    const baseName = grp.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 18);
    const newCode = `${baseName}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    grp.invite_code = newCode;
    grp.is_invite_link_active = true;

    setLocal(KEYS.CHAT_GROUPS, groups);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated', { detail: grp }));
    }
    return { success: true, newCode, message: 'Invite link reset successfully. Previous link is now invalid.', group: grp };
  }

  static deleteChatGroup(groupId: string): { success: boolean; message: string } {
    // Add to dissolved groups registry
    const dissolved = getLocal<string[]>(KEYS.DISSOLVED_GROUPS, []);
    if (!dissolved.includes(groupId)) {
      dissolved.push(groupId);
      setLocal(KEYS.DISSOLVED_GROUPS, dissolved);
    }

    // Remove from chat groups
    const rawGroups = getLocal<ChatGroup[]>(KEYS.CHAT_GROUPS, INITIAL_CHAT_GROUPS);
    const filteredGroups = rawGroups.filter(g => g.id !== groupId);
    setLocal(KEYS.CHAT_GROUPS, filteredGroups);

    // Remove from community groups
    const rawComm = getLocal<CommunityGroup[]>(KEYS.GROUPS, MOCK_COMMUNITY_GROUPS);
    const filteredComm = rawComm.filter(g => g.id !== groupId);
    setLocal(KEYS.GROUPS, filteredComm);

    // Clean messages
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    if (allMsgs[groupId]) {
      delete allMsgs[groupId];
      setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
    }

    return { success: true, message: 'Group dissolved successfully.' };
  }

  static updateGroupSettings(groupId: string, updates: Partial<ChatGroup>): { success: boolean; group?: ChatGroup; message: string } {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return { success: false, message: 'Group not found' };

    Object.assign(grp, updates);
    setLocal(KEYS.CHAT_GROUPS, groups);

    // Synchronize name/description in community groups if applicable
    if (updates.name || updates.description) {
      const comm = getLocal<CommunityGroup[]>(KEYS.GROUPS, MOCK_COMMUNITY_GROUPS);
      const cg = comm.find(c => c.id === groupId);
      if (cg) {
        if (updates.name) cg.name = updates.name;
        if (updates.description) cg.description = updates.description;
        setLocal(KEYS.GROUPS, comm);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated', { detail: grp }));
    }

    return { success: true, group: grp, message: 'Group settings updated successfully.' };
  }

  static createChatGroup(groupData: Omit<ChatGroup, 'id' | 'created_at' | 'invite_code' | 'member_ids'> & { initial_member_ids?: string[] }): ChatGroup {
    const groups = this.getChatGroups();
    const id = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invite_code = `${groupData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const newGroup: ChatGroup = {
      ...groupData,
      id,
      invite_code,
      created_at: new Date().toISOString(),
      member_ids: groupData.initial_member_ids || [groupData.created_by]
    };
    groups.unshift(newGroup);
    setLocal(KEYS.CHAT_GROUPS, groups);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated', { detail: newGroup }));
    }
    return newGroup;
  }

  static joinChatGroup(groupId: string, userId: string, paidAmount?: number, isAdminAdd: boolean = false): { success: boolean; message: string; group?: ChatGroup; alreadyMember?: boolean } {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return { success: false, message: 'Group not found' };

    // Clear per-user exit flag immediately so this specific user can actively participate
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`gcz_exited_${groupId}_${userId}`);
      }
    } catch {}

    // Check if user was removed by admin (cannot rejoin via invite link)
    if (!isAdminAdd && grp.removed_user_ids && grp.removed_user_ids.includes(userId)) {
      return { 
        success: false, 
        message: 'You were removed from this group by an admin. You cannot rejoin via invite link unless re-added by an admin.' 
      };
    }

    // If user is already in the group, tell them they are already in the group without sending duplicate join messages!
    if (grp.member_ids.includes(userId)) {
      return { 
        success: true, 
        message: `You are already a member of ${grp.name}.`, 
        group: grp, 
        alreadyMember: true 
      };
    }

    // Check if paid group
    if (grp.is_paid && !paidAmount) {
      const users = this.getAllUsers();
      const user = users.find(u => u.id === userId);
      const isPrivileged = user?.role === 'super_admin' || user?.role === 'developer';
      if (!isPrivileged) {
        return { success: false, message: `Payment of $${grp.price_usd || 150} is required to join ${grp.name}.` };
      }
    }

    // If previously removed and now being added, clear from removed_user_ids
    if (grp.removed_user_ids && grp.removed_user_ids.includes(userId)) {
      grp.removed_user_ids = grp.removed_user_ids.filter(id => id !== userId);
    }

    grp.member_ids.push(userId);
    setLocal(KEYS.CHAT_GROUPS, groups);

    // Record membership with fresh joined_at timestamp (so new members only see messages from their join time)
    const memberships = getLocal<GroupMembership[]>(KEYS.GROUP_MEMBERSHIPS, []);
    const existing = memberships.find(m => m.group_id === groupId && m.user_id === userId);
    const expires_at = grp.is_paid 
      ? new Date(Date.now() + (grp.duration_months || 3) * 30 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const nowIso = new Date().toISOString();
    if (existing) {
      existing.status = 'active';
      existing.joined_at = nowIso;
      delete existing.left_at;
      existing.expires_at = expires_at;
      if (paidAmount) existing.paid_amount = (existing.paid_amount || 0) + paidAmount;
    } else {
      memberships.push({
        user_id: userId,
        group_id: groupId,
        joined_at: nowIso,
        expires_at,
        status: 'active',
        paid_amount: paidAmount || 0
      });
    }
    setLocal(KEYS.GROUP_MEMBERSHIPS, memberships);

    // Announce in group
    const users = this.getAllUsers();
    const joinedUser = users.find(u => u.id === userId);
    this.sendChatGroupMessage(groupId, {
      sender_id: 'system',
      sender_name: 'Gateway System',
      text: `${joinedUser?.full_name || 'A believer'} joined ${grp.name}. Welcome in Jesus' name! 🕊️`,
      is_system: true
    });

    // Synchronize community group real count
    const commGroups = getLocal<CommunityGroup[]>(KEYS.GROUPS, MOCK_COMMUNITY_GROUPS);
    const cg = commGroups.find(c => c.id === groupId);
    if (cg) {
      cg.member_count = grp.member_ids.length;
      setLocal(KEYS.GROUPS, commGroups);
    }

    SupabaseSyncService.syncGroupMember(groupId, userId, true).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
    }

    return { success: true, message: `Successfully joined ${grp.name}!`, group: grp };
  }

  static leaveChatGroup(groupId: string, userId: string): { success: boolean; message: string; group?: ChatGroup } {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return { success: false, message: 'Group not found' };

    // Record per-user exited flag so only this specific user is marked as exited
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`gcz_exited_${groupId}_${userId}`, 'true');
      }
    } catch {}

    if (grp.member_ids.includes(userId)) {
      grp.member_ids = grp.member_ids.filter(id => id !== userId);
      // If user was an admin but not creator, remove admin privileges
      if (grp.admin_ids && grp.created_by !== userId) {
        grp.admin_ids = grp.admin_ids.filter(id => id !== userId);
      }
      setLocal(KEYS.CHAT_GROUPS, groups);
    }

    // Update membership status
    const memberships = getLocal<GroupMembership[]>(KEYS.GROUP_MEMBERSHIPS, []);
    const existing = memberships.find(m => m.group_id === groupId && m.user_id === userId);
    if (existing) {
      existing.status = 'expired';
      existing.left_at = new Date().toISOString();
      setLocal(KEYS.GROUP_MEMBERSHIPS, memberships);
    }

    // Synchronize community group real count
    const commGroups = getLocal<CommunityGroup[]>(KEYS.GROUPS, MOCK_COMMUNITY_GROUPS);
    const cg = commGroups.find(c => c.id === groupId);
    if (cg) {
      cg.member_count = grp.member_ids.length;
      setLocal(KEYS.GROUPS, commGroups);
    }

    SupabaseSyncService.syncGroupMember(groupId, userId, false).catch(() => {});

    // Announce exit in group
    const users = this.getAllUsers();
    const leftUser = users.find(u => u.id === userId);
    this.sendChatGroupMessage(groupId, {
      sender_id: 'system',
      sender_name: 'Gateway System',
      text: `${leftUser?.full_name || 'A believer'} exited the group fellowship.`,
      is_system: true
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
    }

    return { success: true, message: `Successfully exited ${grp.name}.`, group: grp };
  }

  static removeMemberFromGroup(groupId: string, targetUserId: string, adminUserId: string): { success: boolean; message: string } {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return { success: false, message: 'Group not found' };

    const users = this.getAllUsers();
    const targetUser = users.find(u => u.id === targetUserId);
    const adminUser = users.find(u => u.id === adminUserId);

    if (grp.member_ids.includes(targetUserId)) {
      grp.member_ids = grp.member_ids.filter(id => id !== targetUserId);
      if (grp.admin_ids) {
        grp.admin_ids = grp.admin_ids.filter(id => id !== targetUserId);
      }
      if (!grp.removed_user_ids) grp.removed_user_ids = [];
      if (!grp.removed_user_ids.includes(targetUserId)) {
        grp.removed_user_ids.push(targetUserId);
      }
      setLocal(KEYS.CHAT_GROUPS, groups);
    }

    // Update membership status
    const memberships = getLocal<GroupMembership[]>(KEYS.GROUP_MEMBERSHIPS, []);
    const existing = memberships.find(m => m.group_id === groupId && m.user_id === targetUserId);
    if (existing) {
      existing.status = 'expired';
      existing.left_at = new Date().toISOString();
      setLocal(KEYS.GROUP_MEMBERSHIPS, memberships);
    }

    // Synchronize community group real count
    const commGroups = getLocal<CommunityGroup[]>(KEYS.GROUPS, MOCK_COMMUNITY_GROUPS);
    const cg = commGroups.find(c => c.id === groupId);
    if (cg) {
      cg.member_count = grp.member_ids.length;
      setLocal(KEYS.GROUPS, commGroups);
    }

    // Announce removal in group
    this.sendChatGroupMessage(groupId, {
      sender_id: 'system',
      sender_name: 'Gateway System',
      text: `${targetUser?.full_name || 'Member'} was removed by ${adminUser?.full_name || 'Admin'}.`,
      is_system: true
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
    }

    return { success: true, message: `${targetUser?.full_name || 'Member'} was removed from the group.` };
  }

  static getGroupMembership(groupId: string, userId: string): GroupMembership | undefined {
    const memberships = getLocal<GroupMembership[]>(KEYS.GROUP_MEMBERSHIPS, []);
    return memberships.find(m => m.group_id === groupId && m.user_id === userId);
  }

  static triggerFoundationSchoolExpiryNotice(userId: string): void {
    const memberships = getLocal<GroupMembership[]>(KEYS.GROUP_MEMBERSHIPS, []);
    let mem = memberships.find(m => m.group_id === 'group_foundation_school' && m.user_id === userId);
    if (mem) {
      mem.status = 'expiring_soon';
      mem.expires_at = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      setLocal(KEYS.GROUP_MEMBERSHIPS, memberships);
    } else {
      memberships.push({
        user_id: userId,
        group_id: 'group_foundation_school',
        joined_at: new Date(Date.now() - 88 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'expiring_soon',
        paid_amount: 150
      });
      setLocal(KEYS.GROUP_MEMBERSHIPS, memberships);
    }

    const messageText = `Special Notice: Your membership for the group Foundation School is about to expire! You can pay $150 to continue your 3-month apostolic membership or accept that your current session will conclude.`;
    this.sendDirectMessage('usr_apostle_joe', userId, messageText);
    this.addAppNotification({
      type: 'chat',
      actor_id: 'usr_apostle_joe',
      actor_name: 'Apostle Joe Daniels',
      actor_avatar: '/assets/apostle_joe_daniels_main.jpg',
      title: 'Foundation School Expiry Notice',
      message: 'Your 3-month membership term is about to expire. Renew now to continue learning.',
      target_id: 'group_foundation_school'
    });
  }

  static acceptFoundationSchoolExpiry(userId: string): void {
    const memberships = getLocal<GroupMembership[]>(KEYS.GROUP_MEMBERSHIPS, []);
    const mem = memberships.find(m => m.group_id === 'group_foundation_school' && m.user_id === userId);
    if (mem) {
      mem.status = 'expired';
      setLocal(KEYS.GROUP_MEMBERSHIPS, memberships);
    }
  }

  static sendGroupInvite(groupId: string, targetUserId: string, invitedById: string): { status: 'added' | 'invite_sent'; message: string } {
    const users = this.getAllUsers();
    const targetUser = users.find(u => u.id === targetUserId);
    const invitingUser = users.find(u => u.id === invitedById);
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);

    if (!targetUser || !grp) {
      return { status: 'invite_sent', message: 'User or group not found' };
    }

    // Admins, Mods, Super Admins, and Developers cannot be added directly without consent - official WhatsApp invite protocol
    const requiresConsent = ['admin', 'moderator', 'super_admin', 'developer', 'pastor'].includes(targetUser.role);
    if (requiresConsent) {
      const invites = getLocal<GroupInvite[]>(KEYS.GROUP_INVITES, []);
      const inviteId = `inv_${Date.now()}`;
      const newInvite: GroupInvite = {
        id: inviteId,
        group_id: groupId,
        group_name: grp.name,
        invited_user_id: targetUserId,
        invited_by_id: invitedById,
        invited_by_name: invitingUser?.full_name || 'Admin',
        created_at: new Date().toISOString(),
        status: 'pending'
      };
      invites.push(newInvite);
      setLocal(KEYS.GROUP_INVITES, invites);

      // Direct message invite with official invite link format
      this.sendDirectMessage(
        invitedById, 
        targetUserId, 
        `Official Group Invitation: You have been invited by ${invitingUser?.full_name || 'Admin'} to join "${grp.name}". Official Invite Link: https://gatewayconnect.church/join/group?code=${grp.invite_code}`
      );

      return { 
        status: 'invite_sent', 
        message: `As ${targetUser.full_name} is an official ${targetUser.role.replace('_', ' ')}, an invitation link with Join and Decline buttons has been sent to their inbox.` 
      };
    } else {
      // Regular user added directly
      this.joinChatGroup(groupId, targetUserId, grp.is_paid ? grp.price_usd : undefined, true);
      return { 
        status: 'added', 
        message: `${targetUser.full_name} has been added to ${grp.name}.` 
      };
    }
  }

  static getGroupInvites(userId: string): GroupInvite[] {
    const invites = getLocal<GroupInvite[]>(KEYS.GROUP_INVITES, []);
    return invites.filter(i => i.invited_user_id === userId && i.status === 'pending');
  }

  static respondToGroupInvite(inviteId: string, accept: boolean): { success: boolean; message: string } {
    const invites = getLocal<GroupInvite[]>(KEYS.GROUP_INVITES, []);
    const inv = invites.find(i => i.id === inviteId);
    if (!inv) return { success: false, message: 'Invite not found' };

    inv.status = accept ? 'accepted' : 'declined';
    setLocal(KEYS.GROUP_INVITES, invites);

    if (accept) {
      this.joinChatGroup(inv.group_id, inv.invited_user_id, undefined, true);
      return { success: true, message: `Accepted invitation to ${inv.group_name}!` };
    } else {
      return { success: true, message: `Declined invitation to ${inv.group_name}.` };
    }
  }

  static getChatGroupMessages(groupId: string): ChatGroupMessage[] {
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    return allMsgs[groupId] || [];
  }

  static getChatGroupMessagesForUser(groupId: string, userId: string): ChatGroupMessage[] {
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    const msgs = allMsgs[groupId] || [];
    
    // Filter out messages deleted by this user for themselves
    return msgs.filter(m => !m.deleted_for_users || !m.deleted_for_users.includes(userId));
  }

  static deleteChatGroupMessage(groupId: string, messageId: string, userId: string, forEveryone: boolean): boolean {
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    const groupMsgs = allMsgs[groupId];
    if (!groupMsgs) return false;

    const msg = groupMsgs.find(m => m.id === messageId);
    if (!msg) return false;

    if (forEveryone) {
      msg.deleted_for_everyone = true;
      msg.text = 'This message was deleted';
    } else {
      if (!msg.deleted_for_users) msg.deleted_for_users = [];
      if (!msg.deleted_for_users.includes(userId)) {
        msg.deleted_for_users.push(userId);
      }
    }

    setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
    }
    return true;
  }

  static deleteMultipleChatGroupMessages(groupId: string, messageIds: string[], userId: string, forEveryone: boolean): boolean {
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    const groupMsgs = allMsgs[groupId];
    if (!groupMsgs) return false;

    messageIds.forEach(id => {
      const msg = groupMsgs.find(m => m.id === id);
      if (msg) {
        if (forEveryone) {
          msg.deleted_for_everyone = true;
          msg.text = 'This message was deleted';
        } else {
          if (!msg.deleted_for_users) msg.deleted_for_users = [];
          if (!msg.deleted_for_users.includes(userId)) {
            msg.deleted_for_users.push(userId);
          }
        }
      }
    });

    setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
    }
    return true;
  }

  static clearChatGroupMessagesForUser(groupId: string, userId: string): boolean {
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    const groupMsgs = allMsgs[groupId];
    if (!groupMsgs) return false;

    groupMsgs.forEach(msg => {
      if (!msg.deleted_for_users) msg.deleted_for_users = [];
      if (!msg.deleted_for_users.includes(userId)) {
        msg.deleted_for_users.push(userId);
      }
    });

    setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
    }
    return true;
  }

  static deleteDirectMessage(messageId: string, userId: string, forEveryone: boolean): boolean {
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    const msg = all.find(m => m.id === messageId);
    if (!msg) return false;

    if (forEveryone) {
      msg.deleted_for_everyone = true;
      msg.text = 'This message was deleted';
    } else {
      if (!msg.deleted_for_users) msg.deleted_for_users = [];
      if (!msg.deleted_for_users.includes(userId)) {
        msg.deleted_for_users.push(userId);
      }
    }

    setLocal(KEYS.DIRECT_MESSAGES, all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_dms_updated'));
    }
    return true;
  }

  static deleteMultipleDirectMessages(messageIds: string[], userId: string, forEveryone: boolean): boolean {
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    messageIds.forEach(id => {
      const msg = all.find(m => m.id === id);
      if (msg) {
        if (forEveryone) {
          msg.deleted_for_everyone = true;
          msg.text = 'This message was deleted';
        } else {
          if (!msg.deleted_for_users) msg.deleted_for_users = [];
          if (!msg.deleted_for_users.includes(userId)) {
            msg.deleted_for_users.push(userId);
          }
        }
      }
    });

    setLocal(KEYS.DIRECT_MESSAGES, all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_dms_updated'));
    }
    return true;
  }

  static clearDirectMessagesForUser(userAId: string, userBId: string, currentUserId: string): boolean {
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    all.forEach(m => {
      if (
        (m.sender_id === userAId && m.receiver_id === userBId) ||
        (m.sender_id === userBId && m.receiver_id === userAId)
      ) {
        if (!m.deleted_for_users) m.deleted_for_users = [];
        if (!m.deleted_for_users.includes(currentUserId)) {
          m.deleted_for_users.push(currentUserId);
        }
      }
    });

    setLocal(KEYS.DIRECT_MESSAGES, all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_dms_updated'));
    }
    return true;
  }

  static sendChatGroupMessage(groupId: string, messageData: Omit<ChatGroupMessage, 'id' | 'group_id' | 'created_at'>): ChatGroupMessage {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (grp && messageData.sender_id !== 'system') {
      const user = this.getAllUsers().find(u => u.id === messageData.sender_id);
      const isPrivileged = user?.role === 'super_admin' || user?.role === 'developer';
      const hasExited = this.hasUserExitedGroup(groupId, messageData.sender_id);
      if (hasExited) {
        throw new Error("You exited this group fellowship. Please rejoin to send messages.");
      }
      if (grp.is_paid && !grp.member_ids?.includes(messageData.sender_id) && !isPrivileged) {
        throw new Error(`Enrollment required to participate in ${grp.name}.`);
      }
      if (!grp.member_ids.includes(messageData.sender_id)) {
        grp.member_ids.push(messageData.sender_id);
        setLocal(KEYS.CHAT_GROUPS, groups);
        SupabaseSyncService.syncGroupMember(groupId, messageData.sender_id, true).catch(() => {});
      }
    }

    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    if (!allMsgs[groupId]) {
      allMsgs[groupId] = [];
    }
    const newMsg: ChatGroupMessage = {
      ...messageData,
      id: `gmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      group_id: groupId,
      created_at: new Date().toISOString(),
      read_by_user_ids: [messageData.sender_id]
    };
    allMsgs[groupId].push(newMsg);
    setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);

    SupabaseSyncService.syncGroupMessage(newMsg).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_group_messages_updated', { detail: { groupId, message: newMsg } }));
    }

    return newMsg;
  }

  static getAllChatGroupMessages(): ChatGroupMessage[] {
    return Object.values(getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES)).flat();
  }

  static applyLiveState(state: {
    testimonies?: Testimony[];
    prayers?: PrayerRequest[];
    directMessages?: DirectMessage[];
    fellowshipPosts?: ChatGroupMessage[];
  }): void {
    if (state.testimonies?.length) setLocal(KEYS.TESTIMONIES, state.testimonies);
    if (state.prayers?.length) setLocal(KEYS.PRAYERS, state.prayers);
    if (state.directMessages?.length) setLocal(KEYS.DIRECT_MESSAGES, state.directMessages);
    if (state.fellowshipPosts?.length) {
      const grouped = state.fellowshipPosts.reduce<Record<string, ChatGroupMessage[]>>((all, message) => {
        (all[message.group_id] ||= []).push(message);
        return all;
      }, {});
      setLocal(KEYS.CHAT_GROUP_MESSAGES, grouped);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('gcz_live_state_updated'));
  }

  static applyLiveEvent(type: string, payload: unknown): void {
    if (type === 'direct_message') {
      const message = payload as DirectMessage & { deleted?: boolean };
      if (message.deleted) {
        const messages = this.getAllDirectMessages().filter(item => item.id !== message.id);
        setLocal(KEYS.DIRECT_MESSAGES, messages);
        window.dispatchEvent(new CustomEvent('gcz_direct_messages_updated', { detail: message }));
      } else {
        this.receiveIncomingDirectMessage(message);
      }
    } else if (type === 'fellowship_post') {
      const message = payload as ChatGroupMessage & { deleted?: boolean };
      if (message.deleted) {
        const all = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
        all[message.group_id] = (all[message.group_id] || []).filter(item => item.id !== message.id);
        setLocal(KEYS.CHAT_GROUP_MESSAGES, all);
        window.dispatchEvent(new CustomEvent('gcz_group_messages_updated', { detail: { groupId: message.group_id, message } }));
      } else {
        this.receiveIncomingGroupMessage(message);
      }
    } else if (type === 'prayer') {
      const prayer = payload as PrayerRequest;
      const prayers = this.getPrayerRequests().filter(item => item.id !== prayer.id);
      prayers.unshift(prayer);
      setLocal(KEYS.PRAYERS, prayers);
      window.dispatchEvent(new CustomEvent('gcz_prayer_updated', { detail: prayer }));
    } else if (['testimony', 'comment', 'like'].includes(type)) {
      const testimony = payload as Testimony;
      const testimonies = this.getTestimonies();
      if ((testimony as Testimony & { deleted?: boolean }).deleted) {
        setLocal(KEYS.TESTIMONIES, testimonies.filter(item => item.id !== testimony.id));
      } else {
        const index = testimonies.findIndex(item => item.id === testimony.id);
        if (index >= 0) testimonies[index] = { ...testimonies[index], ...testimony };
        else testimonies.unshift(testimony);
        setLocal(KEYS.TESTIMONIES, testimonies);
      }
      window.dispatchEvent(new CustomEvent('gcz_testimony_updated', { detail: testimony }));
    } else if (type === 'notification') {
      const notif = payload as AppNotification;
      if (notif && notif.id) {
        const list = this.getAppNotifications();
        if (!list.some(n => n.id === notif.id)) {
          list.unshift(notif);
          setLocal(KEYS.APP_NOTIFICATIONS, list);
        }
      }
      window.dispatchEvent(new CustomEvent('gcz_new_notification', { detail: payload }));
      window.dispatchEvent(new CustomEvent('gcz_notifications_updated'));
    } else if (type === 'user_created') {
      const newUser = payload as User;
      if (newUser && newUser.id) {
        const users = this.getAllUsers();
        const idx = users.findIndex(u => u.id === newUser.id || arePhoneNumbersEqual(u.phone, newUser.phone));
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...newUser };
        } else {
          users.push(newUser);
        }
        setLocal(KEYS.ALL_USERS, users);
        const me = this.getCurrentUser();
        if (me && (me.id === newUser.id || arePhoneNumbersEqual(me.phone, newUser.phone))) {
          setLocal(KEYS.CURRENT_USER, { ...me, ...newUser });
        }
        window.dispatchEvent(new CustomEvent('gcz_user_profile_updated', { detail: newUser }));
        window.dispatchEvent(new CustomEvent('gcz_users_synced', { detail: users }));
      }
    } else if (type === 'user_banned') {
      const banData = payload as { phone: string; reason?: string };
      if (banData?.phone) {
        const currentBans = this.getBannedUsers();
        currentBans[banData.phone] = {
          phone: banData.phone,
          reason: banData.reason || 'Account suspended by ministry administrator.',
          banned_at: new Date().toISOString()
        };
        setLocal(KEYS.BANNED_USERS, currentBans);
        window.dispatchEvent(new CustomEvent('gcz_banned_users_updated', { detail: currentBans }));
        // If the banned account is currently active in this session, trigger immediate lockdown
        const me = this.getCurrentUser();
        if (me && arePhoneNumbersEqual(me.phone, banData.phone)) {
          window.dispatchEvent(new CustomEvent('gcz_current_user_banned', { detail: banData }));
        }
      }
    } else if (type === 'unban_user') {
      const unbanData = payload as { phone: string };
      if (unbanData?.phone) {
        const currentBans = this.getBannedUsers();
        delete currentBans[unbanData.phone];
        const clean = unbanData.phone.replace(/[^0-9]/g, '');
        for (const k of Object.keys(currentBans)) {
          if (k === unbanData.phone || (clean && k.replace(/[^0-9]/g, '') === clean)) {
            delete currentBans[k];
          }
        }
        setLocal(KEYS.BANNED_USERS, currentBans);
        window.dispatchEvent(new CustomEvent('gcz_banned_users_updated', { detail: currentBans }));
      }
    } else if (type === 'stream_viewer_joined') {
      const viewer = payload as LiveStreamViewer;
      if (viewer && viewer.user_id) {
        const viewers = this.getStreamViewers();
        const existingIdx = viewers.findIndex(v => v.user_id === viewer.user_id || (viewer.phone && v.phone === viewer.phone));
        if (existingIdx >= 0) {
          viewers[existingIdx] = viewer;
        } else {
          viewers.push(viewer);
        }
        setLocal(KEYS.STREAM_VIEWERS, viewers);

        const history = this.getStreamAttendanceHistory();
        const existingHist = history.find(h => h.user_id === viewer.user_id && h.status === 'active');
        if (!existingHist) {
          history.unshift({
            id: `att_${Date.now()}_${viewer.user_id}`,
            user_id: viewer.user_id,
            user_name: viewer.full_name,
            user_phone: viewer.phone || '0780000000',
            user_handle: viewer.handle || `@${viewer.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            city: viewer.city || 'Harare',
            session_title: 'Supernatural Acceleration & Dominion Service',
            joined_at: viewer.joined_at || new Date().toISOString(),
            status: 'active'
          });
          setLocal(KEYS.STREAM_ATTENDANCE_HISTORY, history);
        }
        window.dispatchEvent(new CustomEvent('gcz_stream_viewers_updated', { detail: viewers }));
        window.dispatchEvent(new CustomEvent('gcz_stream_attendance_updated', { detail: history }));
      }
    } else if (type === 'stream_viewer_left') {
      const data = payload as { userId?: string };
      const targetUserId = data?.userId;
      if (targetUserId) {
        const viewers = this.getStreamViewers().filter(v => v.user_id !== targetUserId);
        setLocal(KEYS.STREAM_VIEWERS, viewers);

        const history = this.getStreamAttendanceHistory();
        const target = history.find(h => h.user_id === targetUserId && h.status === 'active');
        if (target) {
          target.ended_at = new Date().toISOString();
          target.status = 'completed';
          setLocal(KEYS.STREAM_ATTENDANCE_HISTORY, history);
        }
        window.dispatchEvent(new CustomEvent('gcz_stream_viewers_updated', { detail: viewers }));
        window.dispatchEvent(new CustomEvent('gcz_stream_attendance_updated', { detail: history }));
      }
    } else if (type === 'stream_chat' || type === 'stream_reaction') {
      // Ephemeral stream events are handled via window listeners in HomeTab and LiveSermonModal
    } else {
      const eventName = type === 'follow'
        ? 'gcz_follow_updated'
        : type === 'story'
          ? 'gcz_story_updated'
          : type === 'group'
            ? 'gcz_groups_updated'
            : type === 'reaction'
              ? 'gcz_reactions_updated'
              : type === 'pulpit'
                ? 'gcz_pulpit_scripture_updated'
                : 'gcz_stream_url_updated';
        if (type === 'group' && payload && typeof payload === 'object' && 'id' in payload) {
          const groups = this.getChatGroups();
          const group = payload as ChatGroup;
          const index = groups.findIndex(item => item.id === group.id);
          if (index >= 0) groups[index] = { ...groups[index], ...group };
          else groups.unshift(group);
          setLocal(KEYS.CHAT_GROUPS, groups);
        }
        window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
    }
  }

  static receiveIncomingGroupMessage(message: ChatGroupMessage): void {
    if (!message || !message.group_id) return;
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    if (!allMsgs[message.group_id]) {
      allMsgs[message.group_id] = [];
    }
    const exists = allMsgs[message.group_id].some(m => m.id === message.id);
    if (!exists) {
      allMsgs[message.group_id].push(message);
      setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_group_messages_updated', { detail: { groupId: message.group_id, message } }));
      }
    }
  }

  static markGroupMessagesAsRead(groupId: string, currentUserId: string): void {
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    const msgs = allMsgs[groupId];
    if (!msgs || msgs.length === 0) return;
    let changed = false;
    msgs.forEach(m => {
      if (m.sender_id !== currentUserId) {
        if (!m.read_by_user_ids) m.read_by_user_ids = [];
        if (!m.read_by_user_ids.includes(currentUserId)) {
          m.read_by_user_ids.push(currentUserId);
          changed = true;
        }
      }
    });
    if (changed) {
      allMsgs[groupId] = msgs;
      setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);
    }
  }

  static updateGroupInfo(groupId: string, data: { name?: string; description?: string; avatar_url?: string }): boolean {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return false;
    if (data.name) grp.name = data.name.trim();
    if (data.description !== undefined) grp.description = data.description.trim();
    if (data.avatar_url !== undefined) grp.avatar_url = data.avatar_url.trim();
    setLocal(KEYS.CHAT_GROUPS, groups);
    return true;
  }

  static updateGroupSettings(groupId: string, settings: { only_admins_can_send_messages?: boolean; only_admins_can_add_members?: boolean }): boolean {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return false;
    if (settings.only_admins_can_send_messages !== undefined) {
      grp.only_admins_can_send_messages = settings.only_admins_can_send_messages;
    }
    if (settings.only_admins_can_add_members !== undefined) {
      grp.only_admins_can_add_members = settings.only_admins_can_add_members;
    }
    setLocal(KEYS.CHAT_GROUPS, groups);
    return true;
  }

  static togglePromoteGroupAdmin(groupId: string, targetUserId: string): boolean {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return false;
    if (!grp.admin_ids) grp.admin_ids = [grp.created_by];
    const idx = grp.admin_ids.indexOf(targetUserId);
    if (idx >= 0) {
      grp.admin_ids.splice(idx, 1);
    } else {
      grp.admin_ids.push(targetUserId);
    }
    setLocal(KEYS.CHAT_GROUPS, groups);
    return true;
  }

  static togglePinChatGroup(groupId: string, userId: string): boolean {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return false;
    if (!grp.pinned_by_users) grp.pinned_by_users = [];
    const idx = grp.pinned_by_users.indexOf(userId);
    if (idx >= 0) {
      grp.pinned_by_users.splice(idx, 1);
    } else {
      grp.pinned_by_users.push(userId);
    }
    setLocal(KEYS.CHAT_GROUPS, groups);
    return true;
  }

  static toggleArchiveChatGroup(groupId: string, userId: string): boolean {
    const groups = this.getChatGroups();
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return false;
    if (!grp.archived_by_users) grp.archived_by_users = [];
    const idx = grp.archived_by_users.indexOf(userId);
    if (idx >= 0) {
      grp.archived_by_users.splice(idx, 1);
    } else {
      grp.archived_by_users.push(userId);
    }
    setLocal(KEYS.CHAT_GROUPS, groups);
    return true;
  }

  static togglePinDm(otherUserId: string, currentUserId: string): boolean {
    const key = `gcz_pinned_dms_${currentUserId}`;
    const pinned = getLocal<string[]>(key, []);
    const idx = pinned.indexOf(otherUserId);
    if (idx >= 0) {
      pinned.splice(idx, 1);
    } else {
      pinned.push(otherUserId);
    }
    setLocal(key, pinned);
    return true;
  }

  static getPinnedDms(currentUserId: string): string[] {
    return getLocal<string[]>(`gcz_pinned_dms_${currentUserId}`, []);
  }

  static toggleArchiveDm(otherUserId: string, currentUserId: string): boolean {
    const key = `gcz_archived_dms_${currentUserId}`;
    const archived = getLocal<string[]>(key, []);
    const idx = archived.indexOf(otherUserId);
    if (idx >= 0) {
      archived.splice(idx, 1);
    } else {
      archived.push(otherUserId);
    }
    setLocal(key, archived);
    return true;
  }

  static getArchivedDms(currentUserId: string): string[] {
    return getLocal<string[]>(`gcz_archived_dms_${currentUserId}`, []);
  }

  // WhatsApp-style Message Reactions
  static toggleDirectMessageReaction(messageId: string, userId: string, emoji: string, userName?: string): DirectMessage | null {
    const all = getLocal<DirectMessage[]>(KEYS.DIRECT_MESSAGES, []);
    const msg = all.find(m => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = [];

    let isRemoved = false;
    const existingIdx = msg.reactions.findIndex(r => r.user_id === userId);
    if (existingIdx >= 0) {
      if (msg.reactions[existingIdx].emoji === emoji) {
        msg.reactions.splice(existingIdx, 1);
        isRemoved = true;
      } else {
        msg.reactions[existingIdx].emoji = emoji;
        if (userName) msg.reactions[existingIdx].user_name = userName;
      }
    } else {
      msg.reactions.push({ user_id: userId, user_name: userName || 'Believer', emoji });
    }

    setLocal(KEYS.DIRECT_MESSAGES, all);
    SupabaseSyncService.syncMessageReaction(messageId, 'direct', { user_id: userId, user_name: userName, emoji }, isRemoved).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_dms_updated'));
      window.dispatchEvent(new CustomEvent('gcz_reactions_updated', { detail: { messageId, reactions: msg.reactions } }));
    }
    return msg;
  }

  static toggleChatGroupMessageReaction(groupId: string, messageId: string, userId: string, emoji: string, userName?: string): ChatGroupMessage | null {
    const allMsgs = getLocal<Record<string, ChatGroupMessage[]>>(KEYS.CHAT_GROUP_MESSAGES, INITIAL_CHAT_GROUP_MESSAGES);
    const msgs = allMsgs[groupId] || [];
    const msg = msgs.find(m => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = [];

    let isRemoved = false;
    const existingIdx = msg.reactions.findIndex(r => r.user_id === userId);
    if (existingIdx >= 0) {
      if (msg.reactions[existingIdx].emoji === emoji) {
        msg.reactions.splice(existingIdx, 1);
        isRemoved = true;
      } else {
        msg.reactions[existingIdx].emoji = emoji;
        if (userName) msg.reactions[existingIdx].user_name = userName;
      }
    } else {
      msg.reactions.push({ user_id: userId, user_name: userName || 'Believer', emoji });
    }

    setLocal(KEYS.CHAT_GROUP_MESSAGES, allMsgs);
    SupabaseSyncService.syncMessageReaction(messageId, 'group', { user_id: userId, user_name: userName, emoji }, isRemoved).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_chat_group_messages_updated', { detail: { groupId } }));
      window.dispatchEvent(new CustomEvent('gcz_reactions_updated', { detail: { messageId, reactions: msg.reactions } }));
    }
    return msg;
  }

  // Group Shared Media
  static getGroupMedia(groupId: string): GroupMediaItem[] {
    const allMedia = getLocal<Record<string, GroupMediaItem[]>>(KEYS.GROUP_MEDIA, {});
    const list = allMedia[groupId] || [];

    // Also parse media_url from group chat messages
    const groupMsgs = this.getChatGroupMessages(groupId);
    const fromMsgs: GroupMediaItem[] = groupMsgs
      .filter(m => m.media_url && !m.deleted_for_everyone && m.text !== 'This message was deleted')
      .map(m => ({
        id: `gm_msg_${m.id}`,
        group_id: groupId,
        message_id: m.id,
        user_id: m.sender_id,
        user_name: m.sender_name,
        url: m.media_url!,
        type: (m.media_type || 'image') as any,
        caption: m.text && m.text !== 'Shared a photo' ? m.text : undefined,
        created_at: m.created_at
      }));

    // Merge uniquely by url
    const merged = [...list];
    for (const item of fromMsgs) {
      if (!merged.some(m => m.url === item.url)) {
        merged.push(item);
      }
    }
    return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static addGroupMedia(groupId: string, item: Omit<GroupMediaItem, 'id' | 'created_at'>): GroupMediaItem {
    const allMedia = getLocal<Record<string, GroupMediaItem[]>>(KEYS.GROUP_MEDIA, {});
    if (!allMedia[groupId]) allMedia[groupId] = [];
    const newItem: GroupMediaItem = {
      ...item,
      id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };
    allMedia[groupId].unshift(newItem);
    setLocal(KEYS.GROUP_MEDIA, allMedia);
    SupabaseSyncService.syncGroupMedia(groupId, newItem).catch(() => {});
    return newItem;
  }

  static async hydrateGroupMediaFromSupabase(groupId: string): Promise<GroupMediaItem[] | null> {
    if (!groupId) return null;
    try {
      const remoteItems = await SupabaseSyncService.fetchGroupMedia(groupId);
      if (remoteItems && remoteItems.length > 0) {
        const allMedia = getLocal<Record<string, GroupMediaItem[]>>(KEYS.GROUP_MEDIA, {});
        allMedia[groupId] = remoteItems;
        setLocal(KEYS.GROUP_MEDIA, allMedia);
        return remoteItems;
      }
    } catch {
      // Ignore background network error
    }
    return null;
  }
}

type DonationsList = Donation[];

