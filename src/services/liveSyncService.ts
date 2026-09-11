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

    // Connect via Supabase Realtime Channel (Serverless Vercel Architecture)
    this.connectSupabaseRealtime();

    // If an external custom WebSocket server is explicitly specified via env var, also bridge to it
    if (configuredLiveWsUrl) {
      this.connectWebSocket();
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

  /**
   * Native Supabase Realtime Hub (Vercel-compatible)
   * Uses Broadcast and Presence channels so all users sync instantly without maintaining a Node server.
   */
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

      // Listen for peer broadcast events
      channel.on('broadcast', { event: 'live_event' }, (envelope: any) => {
        if (envelope?.payload) {
          this.handleLiveEvent(envelope.payload as LiveEvent);
        }
      });

      // Presence tracking (active church members online)
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeMembers: Array<{ id: string; full_name: string; handle?: string }> = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.id) activeMembers.push(p);
          });
        });
        window.dispatchEvent(new CustomEvent('gcz_live_presence_updated', { detail: activeMembers }));
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentUser) {
          await channel.track({
            id: this.currentUser.id,
            full_name: this.currentUser.full_name,
            handle: this.currentUser.handle,
          });
        }
      });

      this.supabaseChannel = channel;
    } catch (err) {
      console.warn('Supabase Realtime Hub initialization note:', err);
    }
  }

  /**
   * Optional custom WebSocket gateway connection
   */
  private connectWebSocket(): void {
    if (!configuredLiveWsUrl || this.stopped || !this.currentUser) return;
    try {
      this.socket = new WebSocket(configuredLiveWsUrl);
      this.socket.onopen = () => {
        this.sendWs({ type: 'hello', user: this.currentUser });
      };
      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'event' && msg.payload) {
            this.handleLiveEvent(msg.payload);
          } else if (msg.type === 'presence') {
            window.dispatchEvent(new CustomEvent('gcz_live_presence_updated', { detail: msg.payload }));
          }
        } catch {
          // ignore malformed payloads
        }
      };
      this.socket.onclose = () => {
        this.socket = null;
        if (!this.stopped) {
          this.reconnectTimer = window.setTimeout(() => this.connectWebSocket(), 5000);
        }
      };
    } catch {
      // ignore
    }
  }

  private sendWs(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast an event across all connected devices
   */
  broadcastEvent(event: LiveEvent): void {
    if (this.applyingRemote) return;

    // 1. Send via Supabase Realtime broadcast
    if (this.supabaseChannel) {
      void this.supabaseChannel.send({
        type: 'broadcast',
        event: 'live_event',
        payload: event,
      });
    }

    // 2. Send via optional WebSocket if connected
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

  /**
   * Listens for local application actions and broadcasts them to peers
   */
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