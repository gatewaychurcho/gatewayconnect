import { DirectMessage, PrayerRequest, Testimony, ChatGroupMessage, User } from '../types';
import { StorageService } from './storageService';
import { getSupabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Live WebSocket URL: defaults to production Render WebSocket gateway
const getLiveWsUrl = (): string => {
  const envUrl =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LIVE_WS_URL) ||
    (typeof window !== 'undefined' && (window as any).__GCZ_WS_URL) ||
    'wss://gatewayconnect.onrender.com/live';
  if (!envUrl || typeof envUrl !== 'string') return 'wss://gatewayconnect.onrender.com/live';
  const trimmed = envUrl.trim();
  // If running in HTTPS and an unencrypted ws:// was specified, convert to wss://
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && trimmed.startsWith('ws://')) {
    if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
      return 'wss://gatewayconnect.onrender.com/live';
    }
    return trimmed.replace('ws://', 'wss://');
  }
  return trimmed;
};

export type LiveEventType =
  | 'testimony'
  | 'comment'
  | 'like'
  | 'direct_message'
  | 'fellowship_post'
  | 'prayer'
  | 'follow'
  | 'notification'
  | 'story'
  | 'group'
  | 'reaction'
  | 'stream'
  | 'stream_status'
  | 'override_video'
  | 'pulpit'
  | 'stream_chat'
  | 'stream_reaction'
  | 'user_created'
  | 'user_updated'
  | 'user_banned'
  | 'unban_user'
  | 'stream_viewer_joined'
  | 'stream_viewer_left'
  | 'donation'
  | 'media_library';

export type LiveEvent = { type: LiveEventType; payload: unknown };

export type OnlineMember = {
  id: string;
  full_name: string;
  handle?: string;
  avatar_url?: string;
  role?: string;
  city?: string;
  badge_type?: string;
  online_at?: string;
};

export class LiveSyncService {
  private socket: WebSocket | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectTimer: number | undefined;
  private pingInterval: number | undefined;
  private connectTimeout: number | undefined;
  private currentUser: User | null = null;
  private stopped = false;
  private applyingRemote = false;
  private isConnecting = false;
  private retryDelay = 2000;
  private lastPongTime = Date.now();
  private networkListenersBound = false;
  private activeOnlineMembers: OnlineMember[] = [];

  getOnlineMembers(): OnlineMember[] {
    return this.activeOnlineMembers;
  }

  connect(user: User): void {
    this.currentUser = user;
    this.stopped = false;
    this.retryDelay = 2000;
    this.lastPongTime = Date.now();

    // 1. Cross-tab Zero-Latency Broadcast Channel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window && !this.broadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('gcz_cross_tab_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.handleLiveEvent(event.data as LiveEvent);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported:', err);
      }
    }

    // 2. Bind automatic recovery listeners for network drops and tab refocusing
    this.bindNetworkRecoveryListeners();

    // 3. Connect via Supabase Realtime Channel (Global presence & broadcast, always active)
    this.connectSupabaseRealtime();

    // 4. Connect to Render WebSocket Gateway (Dual realtime layer with auto-recovery)
    const wsUrl = getLiveWsUrl();
    if (wsUrl) {
      this.connectWebSocket();
    }
  }

  private bindNetworkRecoveryListeners(): void {
    if (this.networkListenersBound || typeof window === 'undefined') return;
    this.networkListenersBound = true;

    window.addEventListener('online', this.handleNetworkOrFocusChange);
    window.addEventListener('focus', this.handleNetworkOrFocusChange);
    window.addEventListener('pageshow', this.handleNetworkOrFocusChange);
    window.addEventListener('resume', this.handleNetworkOrFocusChange);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.handleNetworkOrFocusChange();
    }
  };

  private handleNetworkOrFocusChange = (): void => {
    if (this.stopped || !this.currentUser) return;
    console.log('🔄 [LiveSync] Network recovery or tab refocus detected at wss://gatewayconnect.onrender.com/live...');

    // 1. Re-verify & re-subscribe Supabase channel presence
    if (this.supabaseChannel && this.currentUser) {
      try {
        void this.supabaseChannel.track({
          id: this.currentUser.id,
          full_name: this.currentUser.full_name,
          handle: this.currentUser.handle,
          avatar_url: this.currentUser.avatar_url,
          role: this.currentUser.role,
          city: this.currentUser.location || (this.currentUser as any).city_location || 'Harare',
          badge_type: this.currentUser.badge_type,
          online_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('⚠️ [LiveSync] Error tracking presence on refocus, renewing Supabase channel...', err);
        this.connectSupabaseRealtime();
      }
    } else {
      this.connectSupabaseRealtime();
    }

    // 2. Re-verify WebSocket gateway connection with zombie detection
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    const isStale = Date.now() - this.lastPongTime > 30000;
    const isSocketOpen = this.socket && this.socket.readyState === WebSocket.OPEN;

    if (!isSocketOpen || isStale) {
      console.log('⚡ [LiveSync] Socket was inactive or dropped. Reconnecting immediately...');
      if (this.socket) {
        try {
          this.socket.close();
        } catch {}
        this.socket = null;
      }
      this.isConnecting = false;
      this.retryDelay = 1000;
      this.connectWebSocket();
    } else {
      // Socket is open and healthy: send immediate ping
      this.sendWs({ type: 'ping', timestamp: Date.now() });
    }
  };

  disconnect(): void {
    this.stopped = true;
    this.isConnecting = false;

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
    if (this.connectTimeout) {
      window.clearTimeout(this.connectTimeout);
      this.connectTimeout = undefined;
    }

    if (this.networkListenersBound && typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleNetworkOrFocusChange);
      window.removeEventListener('focus', this.handleNetworkOrFocusChange);
      window.removeEventListener('pageshow', this.handleNetworkOrFocusChange);
      window.removeEventListener('resume', this.handleNetworkOrFocusChange);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.networkListenersBound = false;
    }

    if (this.supabaseChannel) {
      const supabase = getSupabase();
      if (supabase) void supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }

  private connectSupabaseRealtime(): void {
    const supabase = getSupabase();
    if (!supabase || !this.currentUser) return;

    try {
      const channel = supabase.channel('gcz-live-hub', {
        config: {
          broadcast: { self: false },
          presence: { key: this.currentUser.id },
        },
      });

      channel.on('broadcast', { event: 'live_event' }, (envelope: any) => {
        if (envelope?.payload) {
          this.handleLiveEvent(envelope.payload as LiveEvent);
        }
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const membersMap = new Map<string, OnlineMember>();

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p?.id) {
              membersMap.set(p.id, {
                id: p.id,
                full_name: p.full_name || 'Church Believer',
                handle: p.handle,
                avatar_url: p.avatar_url,
                role: p.role,
                city: p.city || 'Harare',
                badge_type: p.badge_type,
                online_at: p.online_at || new Date().toISOString(),
              });
            }
          });
        });

        // Ensure current active user is always represented
        if (this.currentUser) {
          membersMap.set(this.currentUser.id, {
            id: this.currentUser.id,
            full_name: this.currentUser.full_name,
            handle: this.currentUser.handle,
            avatar_url: this.currentUser.avatar_url,
            role: this.currentUser.role,
            city: this.currentUser.location || this.currentUser.city_location || 'Harare',
            badge_type: this.currentUser.badge_type,
            online_at: new Date().toISOString(),
          });
        }

        this.activeOnlineMembers = Array.from(membersMap.values());
        window.dispatchEvent(new CustomEvent('gcz_live_presence_updated', { detail: this.activeOnlineMembers }));
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentUser) {
          await channel.track({
            id: this.currentUser.id,
            full_name: this.currentUser.full_name,
            handle: this.currentUser.handle,
            avatar_url: this.currentUser.avatar_url,
            role: this.currentUser.role,
            city: this.currentUser.location || this.currentUser.city_location || 'Harare',
            badge_type: this.currentUser.badge_type,
            online_at: new Date().toISOString(),
          });
        }
      });

      this.supabaseChannel = channel;
    } catch (err) {
      console.warn('Supabase Realtime Hub initialization note:', err);
    }
  }

  private connectWebSocket(): void {
    const wsUrl = getLiveWsUrl();
    if (!wsUrl || this.stopped || !this.currentUser || this.isConnecting) return;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    try {
      // Clean up any stale closing socket
      if (this.socket) {
        try {
          this.socket.close();
        } catch {}
        this.socket = null;
      }

      const socket = new WebSocket(wsUrl);
      this.socket = socket;

      // Guard against silent hang during TCP/TLS handshake
      if (this.connectTimeout) window.clearTimeout(this.connectTimeout);
      this.connectTimeout = window.setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.warn('⏱️ [LiveSync] WebSocket connection timed out, scheduling retry...');
          try {
            socket.close();
          } catch {}
        }
      }, 10000);

      socket.onopen = () => {
        if (this.socket !== socket) return;
        this.isConnecting = false;
        if (this.connectTimeout) {
          window.clearTimeout(this.connectTimeout);
          this.connectTimeout = undefined;
        }

        console.log('⚡ Connected to Gateway Connect live hub:', wsUrl);
        this.retryDelay = 2000;
        this.lastPongTime = Date.now();
        this.sendWs({ type: 'hello', user: this.currentUser });
        window.dispatchEvent(new CustomEvent('gcz_hub_connected', { detail: { wsUrl } }));

        // Heartbeat ping every 20s with silent drop detection
        if (this.pingInterval) window.clearInterval(this.pingInterval);
        this.pingInterval = window.setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            // If we haven't received any frame or pong for 45s, connection is stale/dead
            if (Date.now() - this.lastPongTime > 45000) {
              console.warn('⚠️ [LiveSync] No heartbeat received for 45s, resetting socket...');
              try {
                this.socket.close();
              } catch {}
              return;
            }
            this.sendWs({ type: 'ping', timestamp: Date.now() });
          }
        }, 20000);
      };

      socket.onmessage = (event) => {
        this.lastPongTime = Date.now();
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'pong') {
            // Heartbeat acknowledged
            return;
          }
          if (msg.type === 'event' && msg.payload) {
            this.handleLiveEvent(msg.payload);
          } else if (msg.type === 'presence') {
            const list = Array.isArray(msg.payload) ? msg.payload : [];
            const uniqueMap = new Map<string, OnlineMember>();
            for (const item of list) {
              if (item && item.id && !uniqueMap.has(item.id)) {
                uniqueMap.set(item.id, {
                  id: item.id,
                  full_name: item.full_name || 'Church Believer',
                  handle: item.handle,
                  avatar_url: item.avatar_url,
                  role: item.role,
                  city: item.city || 'Harare',
                  badge_type: item.badge_type,
                  online_at: item.online_at || new Date().toISOString(),
                });
              }
            }
            if (this.currentUser && !uniqueMap.has(this.currentUser.id)) {
              uniqueMap.set(this.currentUser.id, {
                id: this.currentUser.id,
                full_name: this.currentUser.full_name,
                handle: this.currentUser.handle,
                avatar_url: this.currentUser.avatar_url,
                role: this.currentUser.role,
                city: this.currentUser.location || (this.currentUser as any).city_location || 'Harare',
                badge_type: this.currentUser.badge_type,
                online_at: new Date().toISOString(),
              });
            }
            this.activeOnlineMembers = Array.from(uniqueMap.values());
            window.dispatchEvent(new CustomEvent('gcz_live_presence_updated', { detail: this.activeOnlineMembers }));
          }
        } catch {
          // ignore malformed frame
        }
      };

      socket.onclose = () => {
        if (this.socket === socket) {
          this.socket = null;
        }
        this.isConnecting = false;
        if (this.connectTimeout) {
          window.clearTimeout(this.connectTimeout);
          this.connectTimeout = undefined;
        }
        if (this.pingInterval) {
          window.clearInterval(this.pingInterval);
          this.pingInterval = undefined;
        }

        if (!this.stopped) {
          // Jittered exponential backoff (base 2s, factor 1.5, max 25s, + jitter)
          const jitter = Math.floor(Math.random() * 1200);
          const delay = this.retryDelay + jitter;
          this.retryDelay = Math.min(Math.round(this.retryDelay * 1.5), 25000);
          this.reconnectTimer = window.setTimeout(() => this.connectWebSocket(), delay);
        }
      };

      socket.onerror = () => {
        // Handled silently: onclose will trigger next reconnect attempt while Supabase ensures continuity
      };
    } catch {
      this.isConnecting = false;
      if (!this.stopped) {
        this.reconnectTimer = window.setTimeout(() => this.connectWebSocket(), 3000);
      }
    }
  }

  private sendWs(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch {
        // Socket write error handled
      }
    }
  }

  broadcastEvent(event: LiveEvent): void {
    if (this.applyingRemote) return;

    // 1. Cross-tab BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch {
        // ignore
      }
    }

    // 2. Supabase Realtime Broadcast (Internet-wide)
    if (this.supabaseChannel) {
      void this.supabaseChannel.send({
        type: 'broadcast',
        event: 'live_event',
        payload: event,
      });
    }

    // 3. Render WebSocket Hub (Internet-wide)
    this.sendWs({ type: 'event', payload: event });
  }

  private handleLiveEvent(event: LiveEvent): void {
    this.applyingRemote = true;
    try {
      StorageService.applyLiveEvent(event.type, event.payload);
      window.dispatchEvent(new CustomEvent('gcz_live_event_received', { detail: event }));
      window.dispatchEvent(new CustomEvent('gcz_live_state_updated'));
    } finally {
      this.applyingRemote = false;
    }
  }

  bindLocalEvents(): () => void {
    const eventNames: Array<[string, LiveEventType]> = [
      ['gcz_testimony_updated', 'testimony'],
      ['gcz_testimony_deleted', 'testimony'],
      ['gcz_media_library_updated', 'media_library'],
      ['gcz_direct_messages_updated', 'direct_message'],
      ['gcz_group_messages_updated', 'fellowship_post'],
      ['gcz_prayer_updated', 'prayer'],
      ['gcz_follow_updated', 'follow'],
      ['gcz_new_notification', 'notification'],
      ['gcz_story_updated', 'story'],
      ['gcz_groups_updated', 'group'],
      ['gcz_reactions_updated', 'reaction'],
      ['gcz_stream_url_updated', 'stream'],
      ['gcz_live_status_updated', 'stream_status'],
      ['gcz_override_video_updated', 'override_video'],
      ['gcz_pulpit_scripture_updated', 'pulpit'],
      ['gcz_stream_chat_sent', 'stream_chat'],
      ['gcz_stream_reaction_sent', 'stream_reaction'],
      ['gcz_user_registered', 'user_created'],
      ['gcz_user_profile_updated', 'user_updated'],
      ['gcz_user_banned_broadcast', 'user_banned'],
      ['gcz_user_unbanned_broadcast', 'unban_user'],
      ['gcz_stream_viewer_joined', 'stream_viewer_joined'],
      ['gcz_stream_viewer_left', 'stream_viewer_left'],
      ['gcz_post_comment_added', 'comment'],
      ['gcz_giving_completed', 'donation'],
    ];

    const handlers = eventNames.map(([name, type]) => {
      const handler = (event: Event) => {
        if (this.applyingRemote) return;
        const detail = (event as CustomEvent).detail;
        const payload = type === 'fellowship_post' ? detail?.message : detail || { updated: true };
        if (payload) {
          this.broadcastEvent({ type, payload });
        }
      };
      window.addEventListener(name, handler);
      return [name, handler] as const;
    });

    return () => {
      handlers.forEach(([name, handler]) => window.removeEventListener(name, handler));
    };
  }
}

export const liveSyncService = new LiveSyncService();
