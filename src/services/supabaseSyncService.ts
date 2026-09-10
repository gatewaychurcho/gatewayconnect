import { getSupabase } from './supabaseClient';
import { Donation, PrayerRequest, ServiceBooking, Sermon, Devotional, Testimony, PostComment, CommunityStory, CartItem, MessageReaction, GroupMediaItem, NotificationSettings } from '../types';

export class SupabaseSyncService {
  /**
   * Normalizes arbitrary payment method string into standard Supabase payment_gateway enum value
   */
  public static normalizeGateway(method?: string): string {
    if (!method) return 'EcoCash Push';
    const m = method.toLowerCase();
    if (m.includes('push') || m.includes('ecocash')) return 'EcoCash Push';
    if (m.includes('onemoney') || m.includes('netone')) return 'OneMoney';
    if (m.includes('telecash')) return 'Telecash';
    if (m.includes('innbucks')) return 'InnBucks';
    if (m.includes('zipit')) return 'ZIPIT';
    if (m.includes('paynow')) return 'Paynow';
    if (m.includes('stripe') || m.includes('card') || m.includes('visa') || m.includes('mastercard')) return 'Credit Card';
    if (m.includes('paypal')) return 'PayPal';
    if (m.includes('moors')) return 'Moors';
    if (m.includes('cash')) return 'Cash';
    return 'EcoCash Push';
  }

  /**
   * Syncs a new donation record into Supabase PostgreSQL
   */
  static async syncDonation(donation: Donation): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const normalizedGateway = this.normalizeGateway(donation.payment_method);

    try {
      // First try inserting with standard normalized gateway
      const { error } = await supabase.from('donations').insert({
        donor_name: donation.donor_name,
        amount: donation.amount,
        currency: donation.currency,
        fund_type: donation.fund_type,
        payment_method: normalizedGateway,
        payment_gateway: normalizedGateway,
        status: donation.status || 'completed',
        receipt_number: donation.receipt_number,
        impact_tag: donation.impact_tag || null,
        is_anonymous: donation.is_anonymous || false
      });

      if (error) {
        // Fallback without payment_gateway in case schema differs
        const fallbackRes = await supabase.from('donations').insert({
          donor_name: donation.donor_name,
          amount: donation.amount,
          currency: donation.currency,
          fund_type: donation.fund_type,
          payment_method: normalizedGateway,
          status: donation.status || 'completed',
          receipt_number: donation.receipt_number,
          impact_tag: donation.impact_tag || null,
          is_anonymous: donation.is_anonymous || false
        });

        if (fallbackRes.error) {
          // If enum check or type error on fund_type, try fallback with Seed Faith while recording impact
          if (donation.fund_type === 'Altar Seed') {
            const altarRes = await supabase.from('donations').insert({
              donor_name: donation.donor_name,
              amount: donation.amount,
              currency: donation.currency,
              fund_type: 'Seed Faith',
              payment_method: normalizedGateway,
              status: donation.status || 'completed',
              receipt_number: donation.receipt_number,
              impact_tag: `[Altar Seed] ${donation.impact_tag || 'Altar Covenant'}`.trim(),
              is_anonymous: donation.is_anonymous || false
            });
            if (!altarRes.error) return { success: true };
          }
          console.warn('Supabase donation sync notice:', fallbackRes.error.message);
          return { success: false, error: fallbackRes.error.message };
        }
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase sync error (offline fallback active):', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Syncs a prayer request into Supabase PostgreSQL
   */
  static async syncPrayerRequest(prayer: PrayerRequest): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    try {
      const { error } = await supabase.from('prayer_requests').insert({
        author_name: prayer.is_anonymous ? 'Anonymous Believer' : prayer.user_name,
        title: prayer.category,
        request_text: prayer.request_text,
        category: prayer.category || 'General',
        is_urgent: false,
        is_answered: prayer.is_answered || false,
        prayer_count: prayer.prayer_count || 1,
        apostle_prayed: prayer.status === 'apostle_prayed'
      });

      if (error) {
        console.warn('Supabase prayer sync notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase prayer sync error (offline fallback active):', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Syncs a 1-on-1 pastoral booking into Supabase PostgreSQL
   */
  static async syncBooking(booking: ServiceBooking): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    try {
      const { error } = await supabase.from('service_bookings').insert({
        session_title: booking.service_type,
        minister_name: 'Apostle Joe Daniels',
        preferred_date: booking.date,
        preferred_time: booking.time_slot,
        status: booking.status || 'confirmed',
        zoom_link: booking.zoom_link
      });

      if (error) {
        console.warn('Supabase booking sync notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase booking sync error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Syncs a community post/testimony into Supabase PostgreSQL
   */
  static async syncPost(post: Testimony): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('posts').upsert({
        id: post.id,
        user_id: post.user_id,
        author_name: post.user_name,
        author_handle: post.user_handle,
        avatar_url: post.user_avatar,
        title: post.title,
        content: post.content,
        category: post.category,
        image_url: post.image_url || null,
        video_url: post.video_url || null,
        youtube_id: post.youtube_id || null,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        created_at: post.created_at || new Date().toISOString()
      });

      if (error) {
        console.warn('Supabase post sync notice (local state retained):', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('Supabase post sync exception:', err.message);
      return false;
    }
  }

  /**
   * Syncs a comment to Supabase PostgreSQL
   */
  static async syncComment(postId: string, comment: PostComment): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('post_comments').insert({
        id: comment.id,
        post_id: postId,
        user_id: comment.user_id,
        user_name: comment.user_name,
        user_handle: comment.user_handle,
        user_avatar: comment.user_avatar,
        text: comment.text,
        likes_count: comment.likes_count || 0,
        badge_type: comment.badge_type || 'none',
        created_at: comment.created_at || new Date().toISOString()
      });

      if (error) {
        console.warn('Supabase comment sync notice:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('Supabase comment sync exception:', err.message);
      return false;
    }
  }

  /**
   * Syncs a reaction (like/emoji) to Supabase PostgreSQL
   */
  static async syncReaction(postId: string, userId: string, reactionType: string = 'heart'): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('user_activities').insert({
        user_id: userId,
        activity_type: 'reaction',
        metadata: { post_id: postId, reaction: reactionType, timestamp: new Date().toISOString() }
      });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Syncs a story to Supabase PostgreSQL
   */
  static async syncStory(story: CommunityStory): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('community_stories').insert({
        id: story.id,
        user_id: story.user_id,
        user_name: story.user_name,
        user_handle: story.user_handle,
        avatar_url: story.avatar_url || story.user_avatar || null,
        badge_type: story.badge_type || 'none',
        image_url: story.image_url || null,
        caption: story.caption || story.text || null,
        scripture: story.scripture || null,
        created_at: story.created_at || new Date().toISOString()
      });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Pulls latest remote rows from Supabase into local cache if tables exist
   */
  static async pullRemoteData(): Promise<{ prayersCount: number; sermonsCount: number; postsCount: number }> {
    const supabase = getSupabase();
    if (!supabase) return { prayersCount: 0, sermonsCount: 0, postsCount: 0 };

    let prayersCount = 0;
    let sermonsCount = 0;
    let postsCount = 0;

    try {
      // Pull prayers
      const { data: prayers, error: pErr } = await supabase
        .from('prayer_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!pErr && prayers && prayers.length > 0) {
        let localPrayers: any[] = [];
        try {
          const raw = localStorage.getItem('gcz_prayers');
          if (raw) localPrayers = JSON.parse(raw);
        } catch (_) {}
        const combined = [...prayers.map((p: any) => ({
          id: p.id,
          user_id: p.user_id || 'usr_remote',
          user_name: p.author_name || 'Church Believer',
          request_text: p.request_text,
          category: p.category || 'General',
          is_anonymous: false,
          is_public: true,
          prayer_count: p.prayer_count || 1,
          created_at: p.created_at,
          status: p.apostle_prayed ? ('apostle_prayed' as const) : ('approved' as const),
          is_answered: p.is_answered
        })), ...localPrayers.filter(lp => !prayers.some((rp: any) => rp.id === lp.id))];

        localStorage.setItem('gcz_prayers', JSON.stringify(combined));
        prayersCount = prayers.length;
      }
    } catch (e) {
      // Ignored for offline tolerance
    }

    try {
      // Pull community posts
      const { data: posts, error: postErr } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!postErr && posts && posts.length > 0) {
        let localPosts: any[] = [];
        try {
          const raw = localStorage.getItem('gcz_testimonies');
          if (raw) localPosts = JSON.parse(raw);
        } catch (_) {}

        const remoteMapped = posts.map((p: any) => ({
          id: p.id,
          user_id: p.user_id || 'usr_apostle_joe',
          user_name: p.author_name || 'Apostle Joe Daniels',
          user_handle: p.author_handle || '@apostle_joe_daniels',
          user_avatar: p.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
          title: p.title || 'Prophetic Word',
          content: p.content || '',
          category: p.category || 'Apostolic Teaching',
          image_url: p.image_url || undefined,
          video_url: p.video_url || undefined,
          youtube_id: p.youtube_id || undefined,
          date: 'Recently',
          created_at: p.created_at,
          liked_user_ids: [],
          likes_count: p.likes_count || 0,
          verified_by_church: true,
          comments_count: p.comments_count || 0,
          comments: []
        }));

        // Merge without duplicating IDs
        const existingIds = new Set(localPosts.map((lp: any) => lp.id));
        const newOnes = remoteMapped.filter((rp: any) => !existingIds.has(rp.id));
        if (newOnes.length > 0) {
          const merged = [...newOnes, ...localPosts];
          localStorage.setItem('gcz_testimonies', JSON.stringify(merged));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gcz_testimony_updated'));
          }
        }
        postsCount = posts.length;
      }
    } catch {
      // Ignored
    }

    return { prayersCount, sermonsCount, postsCount };
  }

  /**
   * Syncs live stream URL with Supabase
   */
  static async syncStreamUrl(url: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('church_settings')
        .upsert({ id: 'primary_stream', current_stream_url: url, updated_at: new Date().toISOString() });
      if (error) {
        await supabase.from('live_streams').upsert({ id: 'active_broadcast', current_stream_url: url });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches latest live stream URL from Supabase
   */
  static async fetchStreamUrl(): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('church_settings')
        .select('current_stream_url')
        .eq('id', 'primary_stream')
        .single();
      if (!error && data?.current_stream_url) {
        return data.current_stream_url;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Real-time sync for follow / unfollow actions across user_follows and follows tables
   */
  static async syncFollowState(followerId: string, followingId: string, isFollowing: boolean): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      if (isFollowing) {
        await supabase.from('user_follows').upsert({
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString()
        });
        await supabase.from('follows').upsert({
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString()
        });
      } else {
        await supabase.from('user_follows')
          .delete()
          .match({ follower_id: followerId, following_id: followingId });
        await supabase.from('follows')
          .delete()
          .match({ follower_id: followerId, following_id: followingId });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches persistent follows for a specific user from Supabase database
   */
  static async fetchFollows(userId: string): Promise<{ following: string[]; followers: string[] } | null> {
    const supabase = getSupabase();
    if (!supabase || !userId) return null;
    try {
      // Query both following and followers
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      const { data: followersData } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

      return {
        following: followingData ? followingData.map((r: any) => r.following_id) : [],
        followers: followersData ? followersData.map((r: any) => r.follower_id) : []
      };
    } catch {
      return null;
    }
  }

  /**
   * Syncs Kingdom Store Cart to Supabase database
   */
  static async syncCart(userId: string, items: CartItem[]): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !userId) return false;
    try {
      // 1. Ensure user cart record exists
      const cartId = `cart_${userId}`;
      await supabase.from('carts').upsert({
        id: cartId,
        user_id: userId,
        status: 'active',
        updated_at: new Date().toISOString()
      });

      // 2. Clear previous items and replace with current items
      await supabase.from('cart_items').delete().eq('user_id', userId);

      if (items.length > 0) {
        const rows = items.map((item, idx) => ({
          id: `item_${userId}_${item.product.id}_${idx}`,
          cart_id: cartId,
          user_id: userId,
          product_id: item.product.id,
          title: item.product.name,
          price: item.product.price_usd,
          quantity: item.quantity,
          category: item.product.category || 'Store',
          image_url: item.product.image_url || null,
          selected_size: item.selectedSize || null,
          updated_at: new Date().toISOString()
        }));
        await supabase.from('cart_items').insert(rows);
      }
      return true;
    } catch (e) {
      console.warn('Cart sync notice:', e);
      return false;
    }
  }

  /**
   * Fetches Kingdom Store Cart from Supabase database
   */
  static async fetchCart(userId: string): Promise<CartItem[] | null> {
    const supabase = getSupabase();
    if (!supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return null;

      return data.map((row: any) => ({
        product: {
          id: row.product_id,
          name: row.title,
          category: row.category,
          price_usd: Number(row.price) || 10,
          price_zig: (Number(row.price) || 10) * 15,
          image_url: row.image_url,
          in_stock: true,
          description: ''
        },
        quantity: row.quantity || 1,
        selectedSize: row.selected_size
      }));
    } catch {
      return null;
    }
  }

  /**
   * Syncs user profile avatar to persistent profile_pictures table
   */
  static async syncProfilePicture(userId: string, avatarUrl: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !userId || !avatarUrl) return false;
    try {
      await supabase.from('profile_pictures').upsert({
        user_id: userId,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });
      // Also update users table avatar_url
      await supabase.from('users').update({
        avatar_url: avatarUrl
      }).eq('id', userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches persistent profile avatar from Supabase
   */
  static async fetchProfilePicture(userId: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase || !userId) return null;
    try {
      const { data } = await supabase
        .from('profile_pictures')
        .select('avatar_url')
        .eq('user_id', userId)
        .single();
      if (data?.avatar_url) return data.avatar_url;
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Syncs WhatsApp-style message reaction in Supabase
   */
  static async syncMessageReaction(
    messageId: string,
    chatType: 'direct' | 'group',
    reaction: MessageReaction,
    isRemoved: boolean = false
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !messageId) return false;
    try {
      if (isRemoved) {
        await supabase
          .from('message_reactions')
          .delete()
          .match({ message_id: messageId, user_id: reaction.user_id, emoji: reaction.emoji });
      } else {
        await supabase.from('message_reactions').upsert({
          id: `react_${messageId}_${reaction.user_id}_${encodeURIComponent(reaction.emoji)}`,
          message_id: messageId,
          chat_type: chatType,
          user_id: reaction.user_id,
          user_name: reaction.user_name || 'Member',
          emoji: reaction.emoji,
          created_at: new Date().toISOString()
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches message reactions from Supabase for a given message
   */
  static async fetchMessageReactions(messageId: string): Promise<MessageReaction[] | null> {
    const supabase = getSupabase();
    if (!supabase || !messageId) return null;
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error || !data) return null;
      return data.map((r: any) => ({
        user_id: r.user_id,
        user_name: r.user_name,
        emoji: r.emoji
      }));
    } catch {
      return null;
    }
  }

  /**
   * Syncs user-specific group membership to Supabase
   */
  static async syncGroupMember(groupId: string, userId: string, isJoining: boolean, role: string = 'member'): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !groupId || !userId) return false;
    try {
      if (isJoining) {
        await supabase.from('group_members').upsert({
          id: `gm_${groupId}_${userId}`,
          group_id: groupId,
          user_id: userId,
          role: role,
          joined_at: new Date().toISOString()
        });
      } else {
        await supabase
          .from('group_members')
          .delete()
          .match({ group_id: groupId, user_id: userId });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches all member IDs for a group from Supabase
   */
  static async fetchGroupMembers(groupId: string): Promise<string[] | null> {
    const supabase = getSupabase();
    if (!supabase || !groupId) return null;
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (error || !data) return null;
      return data.map((r: any) => r.user_id);
    } catch {
      return null;
    }
  }

  /**
   * Syncs shared group media item to Supabase
   */
  static async syncGroupMedia(groupId: string, item: GroupMediaItem): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !groupId || !item.url) return false;
    try {
      await supabase.from('group_media').upsert({
        id: item.id,
        group_id: groupId,
        message_id: item.message_id || null,
        user_id: item.user_id,
        user_name: item.user_name || 'Member',
        media_url: item.url,
        media_type: item.type || 'image',
        caption: item.caption || null,
        created_at: item.created_at || new Date().toISOString()
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches shared group media items from Supabase
   */
  static async fetchGroupMedia(groupId: string): Promise<GroupMediaItem[] | null> {
    const supabase = getSupabase();
    if (!supabase || !groupId) return null;
    try {
      const { data, error } = await supabase
        .from('group_media')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error || !data) return null;
      return data.map((r: any) => ({
        id: r.id,
        group_id: r.group_id,
        message_id: r.message_id,
        user_id: r.user_id,
        user_name: r.user_name,
        url: r.media_url,
        type: r.media_type || 'image',
        caption: r.caption,
        created_at: r.created_at
      }));
    } catch {
      return null;
    }
  }

  /**
   * Sets up Supabase real-time listener for posts, follows, and live stream changes
   */
  static subscribeToRealtimeChanges(
    onPostUpdate?: () => void,
    onFollowUpdate?: () => void,
    onStreamUpdate?: (url: string) => void
  ) {
    const supabase = getSupabase();
    if (!supabase) return () => {};

    try {
      const channel = supabase.channel('gcz_church_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          if (onPostUpdate) onPostUpdate();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_follows' }, () => {
          if (onFollowUpdate) onFollowUpdate();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => {
          if (onFollowUpdate) onFollowUpdate();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gcz_reactions_updated'));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'church_settings' }, (payload: any) => {
          if (onStreamUpdate && payload.new?.current_stream_url) {
            onStreamUpdate(payload.new.current_stream_url);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  }

  static async setLiveStreamUrl(url: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };
    try {
      await supabase.from('church_settings').upsert({
        key: 'live_stream_url',
        current_stream_url: url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Sync user notification preferences to Supabase notification_settings table
   */
  static async syncNotificationSettings(settings: NotificationSettings, userId?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase || !userId) return { success: false, error: 'Supabase client or userId not available' };
    try {
      const { error } = await supabase.from('notification_settings').upsert({
        user_id: userId,
        live_streams: settings.liveStreams,
        prayer_requests: settings.prayerRequests,
        direct_messages: settings.directMessages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) {
        // Fallback: update in users profile metadata
        await supabase.from('users').update({
          notification_settings: settings
        }).eq('id', userId);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

