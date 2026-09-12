import { DirectMessage, PrayerRequest, Testimony, ChatGroupMessage, User } from '../types';
import { StorageService } from './storageService';
import { getSupabase } from './supabaseClient';
import { CONFIG } from '../../config';
import type { RealtimeChannel } from '@supabase/supabase-js';

type LiveEventType =
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
  | 'pulpit';

type LiveEvent = { type: LiveEventType; payload: unknown };

type LiveState = {
  testimonies: Testimony[];
  prayers: PrayerRequest[];
  directMessages: DirectMessage[];
  fellowshipPosts: ChatGroupMessage[];
  activeMembers: Array<{ id: string; full_name: string; handle?: string }>;
};

const configuredLiveWsUrl = CONFIG.LIVE_WS_URL;

export class LiveSyncService {
  private socket: WebSocket | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private reconnectTimer: number | undefined;
  private currentUser: User | null = null;
  private stopped = false;
  private applyingRemote = false;

  connect(user: User): void {
    this.currentUser = user;
    this.stopped = false;

    // Connect via Supabase Realtime Channel
    this.connectSupabaseRealtime();

    // Also connect to external WebSocket hub if configured
    if (configuredLiveWsUrl) {
      console.log("🔌 Attempting WebSocket connection to:", configuredLiveWsUrl);
      this.connectWebSocket();
    } else {
      console.warn("⚠️ No external WebSocket URL configured");
    }
  }

  disconnect(): void {
    this.stopped = true;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);

    if (this.supabaseChannel) {
      const supabase = getSupabase();
      if (supabase) void supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }

    if (this.socket) {
      this.socket.close();
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
          console.log("📡 Supabase broadcast received:", envelope.payload);
          this.handleLiveEvent(envelope.payload as LiveEvent);
        }
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeMembers: Array<{ id: string; full_name: string; handle?: string }> = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.id) activeMembers.push(p);
          });
        });
        console.log("👥 Supabase presence updated:", activeMembers);
        window.dispatchEvent(new CustomEvent('gcz_live_presence_updated', { detail: activeMembers }));
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentUser) {
          console.log("✅ Supabase channel subscribed for user:", this.currentUser);
          await channel.track({
            id: this.currentUser.id,
            full_name: this.currentUser.full_name,
            handle: this.currentUser.handle,
          });
        }
      });

      this.supabaseChannel = channel;
    } catch (err) {
      console.warn('Supabase Realtime Hub initialization error:', err);
    }
  }

  private connectWebSocket(): void {
    if (!configuredLiveWsUrl || this.stopped || !this.currentUser) return;
    try {
      this.socket = new WebSocket(configuredLiveWsUrl);
      this.socket.onopen = () => {
        console.log("✅ Connected to Gateway Connect hub:", configuredLiveWsUrl);
        this.sendWs({ type: 'hello', user: this.currentUser });
      };
      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("📩 Message from hub:", msg);
          if (msg.type === 'event' && msg.payload) {
            this.handleLiveEvent(msg.payload);
          } else if (msg.type === 'presence') {
            console.log("👥 Presence update from hub:", msg.payload);
            window.dispatchEvent(new CustomEvent('gcz_live_presence_updated', { detail: msg.payload }));
          }
        } catch (err) {
          console.error("❌ Malformed hub payload:", err);
        }
      };
      this.socket.onclose = () => {
        console.warn("🔌 Hub WebSocket closed, reconnecting...");
        this.socket = null;
        if (!this.stopped) {
          this.reconnectTimer = window.setTimeout(() => this.connectWebSocket(), 5000);
        }
      };
      this.socket.onerror = (err) => {
        console.error("❌ Hub WebSocket error:", err);
      };
    } catch (err) {
      console.error("❌ Failed to connect to hub:", err);
    }
  }

  private sendWs(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log("➡️ Sending to hub:", message);
      this.socket.send(JSON.stringify(message));
    }
  }

  broadcastEvent(event: LiveEvent): void {
    if (this.applyingRemote) return;

    if (this.supabaseChannel) {
      console.log("➡️ Broadcasting via Supabase:", event);
      void this.supabaseChannel.send({
        type: 'broadcast',
        event: 'live_event',
        payload: event,
      });
    }

    this.sendWs({ type: 'event', payload: event });
  }

  private handleLiveEvent(event: LiveEvent): void {
    this.applyingRemote = true;
    try {
      console.log("📥 Applying live event:", event);
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
      ['gcz_direct_messages_updated', 'direct_message'],
      ['gcz_group_messages_updated', 'fellowship_post'],
      ['gcz_prayer_updated', 'prayer'],
      ['gcz_follow_updated', 'follow'],
      ['gcz_new_notification', 'notification'],
      ['gcz_story_updated', 'story'],
      ['gcz_groups_updated', 'group'],
      ['gcz_reactions_updated', 'reaction'],
      ['gcz_stream_url_updated', 'stream'],
      ['gcz_pulpit_scripture_updated', 'pulpit'],
    ];

    const handlers = eventNames.map(([name, type]) => {
      const handler = (event: Event) => {
        if (this.applyingRemote) return;
        const detail = (event as CustomEvent).detail;
        const payload = type === 'fellowship_post' ? detail?.message : detail || { updated: true };
        if (payload) {
          console.log("📤 Local event triggered:", type, payload);
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
