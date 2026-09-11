import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeHandlers = {
  directMessages?: (payload: unknown) => void;
  messages?: (payload: unknown) => void;
  posts?: (payload: unknown) => void;
  comments?: (payload: unknown) => void;
  prayers?: (payload: unknown) => void;
  liveStreams?: (payload: unknown) => void;
  reactions?: (payload: unknown) => void;
  onPresenceSync?: (activeMembers: Array<{ id: string; full_name: string; handle?: string }>) => void;
  onBroadcastEvent?: (event: { type: string; payload: unknown }) => void;
};

export function subscribeToRealtime(
  supabase: SupabaseClient,
  handlers: RealtimeHandlers = {},
  currentUser?: { id: string; full_name: string; handle?: string }
): () => void {
  const channel: RealtimeChannel = supabase.channel('gatewayconnect-realtime', {
    config: {
      broadcast: { self: false },
      presence: { key: currentUser?.id || 'anon' },
    },
  });

  // 1. Direct Messages
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'direct_messages' },
    (payload) => {
      handlers.directMessages?.(payload);
    }
  );

  // 2. Fellowship / Group Messages
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => {
      handlers.messages?.(payload);
    }
  );

  // 3. Posts & Testimonies
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => {
      handlers.posts?.(payload);
    }
  );

  // 4. Post Comments
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'post_comments' },
    (payload) => {
      handlers.comments?.(payload);
    }
  );

  // 5. Prayer Requests
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'prayer_requests' },
    (payload) => {
      handlers.prayers?.(payload);
    }
  );

  // 6. Live Streams Broadcast Status
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'live_streams' },
    (payload) => {
      handlers.liveStreams?.(payload);
    }
  );

  // 7. Message Reactions
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'message_reactions' },
    (payload) => {
      handlers.reactions?.(payload);
    }
  );

  // 8. Ephemeral Broadcast Events (Amen reactions, live chat bursts, pulpit scriptures)
  channel.on('broadcast', { event: 'live_event' }, (envelope: any) => {
    if (envelope?.payload) {
      handlers.onBroadcastEvent?.(envelope.payload);
    }
  });

  // 9. Member Presence Tracking
  channel.on('presence', { event: 'sync' }, () => {
    const presenceState = channel.presenceState();
    const members: Array<{ id: string; full_name: string; handle?: string }> = [];
    Object.values(presenceState).forEach((presences: any) => {
      presences.forEach((p: any) => {
        if (p.id) members.push(p);
      });
    });
    handlers.onPresenceSync?.(members);
  });

  channel.subscribe(async (status, error) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Supabase Realtime connected');
      if (currentUser && currentUser.id) {
        await channel.track({
          id: currentUser.id,
          full_name: currentUser.full_name,
          handle: currentUser.handle,
        });
      }
      return;
    }

    if (status === 'CHANNEL_ERROR') {
      console.warn('⚠️ Supabase Realtime channel error (tables may be syncing):', error);
      return;
    }

    if (status === 'TIMED_OUT') {
      console.warn('⚠️ Supabase Realtime connection timed out:', error);
      return;
    }

    if (status === 'CLOSED') {
      console.info('Supabase Realtime channel closed');
      return;
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function broadcastLiveEvent(
  supabase: SupabaseClient,
  event: { type: string; payload: unknown }
): Promise<void> {
  const channel = supabase.channel('gatewayconnect-realtime');
  await channel.send({
    type: 'broadcast',
    event: 'live_event',
    payload: event,
  });
}
