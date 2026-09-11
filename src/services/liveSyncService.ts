import { DirectMessage, PrayerRequest, Testimony, ChatGroupMessage, User } from '../types';
import { StorageService } from './storageService';

type LiveEventType = 'testimony' | 'comment' | 'like' | 'direct_message' | 'fellowship_post' | 'prayer' | 'follow' | 'notification' | 'story' | 'group' | 'reaction' | 'stream' | 'pulpit';
type LiveEvent = { type: LiveEventType; payload: unknown };
type LiveState = {
  testimonies: Testimony[];
  prayers: PrayerRequest[];
  directMessages: DirectMessage[];
  fellowshipPosts: ChatGroupMessage[];
  activeMembers: Array<{ id: string; full_name: string; handle?: string }>;
};

const configuredLiveUrl = (import.meta as ImportMeta & { env?: { VITE_LIVE_WS_URL?: string } }).env?.VITE_LIVE_WS_URL?.trim();
const LOCAL_WS_URL = `ws://${window.location.hostname}:8787/live`;
const CONNECTION_TIMEOUT_MS = 2500;
const MAX_RECONNECT_ATTEMPTS = 4;

export class LiveSyncService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | undefined;
  private currentUser: User | null = null;
  private stopped = false;
  private applyingRemote = false;
  private reconnectAttempts = 0;
  private connectionTimer: number | undefined;

  connect(user: User): void {
    this.currentUser = user;
    this.stopped = false;
    this.reconnectAttempts = 0;
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    if (!this.getUrl()) return;
    this.open();
  }

  disconnect(): void {
    this.stopped = true;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.connectionTimer) window.clearTimeout(this.connectionTimer);
    this.socket?.close();
    this.socket = null;
  }

  private getUrl(): string | null {
    if (configuredLiveUrl) {
      try {
        const url = new URL(configuredLiveUrl);
        if (url.protocol === 'http:') url.protocol = 'ws:';
        if (url.protocol === 'https:') url.protocol = 'wss:';
        if (url.protocol === 'ws:' || url.protocol === 'wss:') {
          if (url.pathname === '/' || !url.pathname) url.pathname = '/live';
          return url.toString();
        }
      } catch {
        return null;
      }
    }
    const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV;
    if (isDevelopment) return LOCAL_WS_URL;
    return null;
  }

  private open(): void {
    const url = this.getUrl();
    if (this.stopped || !this.currentUser || !url) return;
    try {
      this.socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.connectionTimer = window.setTimeout(() => {
      if (this.socket?.readyState === WebSocket.CONNECTING) this.socket.close();
    }, CONNECTION_TIMEOUT_MS);
    this.socket.onopen = () => {
      if (this.connectionTimer) window.clearTimeout(this.connectionTimer);
      this.reconnectAttempts = 0;
      this.send({ type: 'hello', user: this.currentUser });
      this.send({ type: 'sync_state', payload: this.localState() });
    };
    this.socket.onmessage = (event) => {
      try {
        this.handleMessage(JSON.parse(event.data) as { type: string; payload: unknown });
      } catch {
        // Ignore malformed hub messages without affecting the app shell.
      }
    };
    this.socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped || !this.getUrl() || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 8000);
    this.reconnectTimer = window.setTimeout(() => this.open(), delay);
  }

  private send(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  private localState(): LiveState {
    return {
      testimonies: StorageService.getTestimonies(),
      prayers: StorageService.getPrayerRequests(),
      directMessages: StorageService.getAllDirectMessages(),
      fellowshipPosts: StorageService.getAllChatGroupMessages(),
      activeMembers: []
    };
  }

  private handleMessage(message: { type: string; payload: unknown }): void {
    if (message.type === 'live_state') {
      this.applyingRemote = true;
      StorageService.applyLiveState(message.payload as LiveState);
      this.applyingRemote = false;
      return;
    }
    if (message.type === 'presence') {
      window.dispatchEvent(new CustomEvent('gcz_live_presence_updated', { detail: message.payload }));
      return;
    }
    if (message.type === 'event') {
      const event = message.payload as LiveEvent;
      this.applyingRemote = true;
      StorageService.applyLiveEvent(event.type, event.payload);
      this.applyingRemote = false;
      window.dispatchEvent(new CustomEvent('gcz_live_event_received', { detail: event }));
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
      ['gcz_pulpit_scripture_updated', 'pulpit']
    ];
    const handlers = eventNames.map(([name, type]) => {
      const handler = (event: Event) => {
        if (this.applyingRemote) return;
        const detail = (event as CustomEvent).detail;
        const payload = type === 'fellowship_post' ? detail?.message : detail || { updated: true };
        if (payload) this.send({ type: 'event', payload: { type, payload } });
      };
      window.addEventListener(name, handler);
      return [name, handler] as const;
    });
    return () => handlers.forEach(([name, handler]) => window.removeEventListener(name, handler));
  }
}

export const liveSyncService = new LiveSyncService();