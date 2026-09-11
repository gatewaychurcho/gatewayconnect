import type { SupabaseClient } from '@supabase/supabase-js';

type RealtimeHandlers = {
  directMessages?: (payload: unknown) => void;
  posts?: (payload: unknown) => void;
  communityPosts?: (payload: unknown) => void;
  liveStreams?: (payload: unknown) => void;
};

export function subscribeToRealtime(
  supabase: SupabaseClient,
  handlers: RealtimeHandlers = {}
) {
  const channel = supabase
    .channel('gatewayconnect-realtime')

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
      },
      (payload) => {
        console.log('Realtime direct_messages event:', payload);
        handlers.directMessages?.(payload);
      }
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
      },
      (payload) => {
        console.log('Realtime posts event:', payload);
        handlers.posts?.(payload);
      }
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_posts',
      },
      (payload) => {
        console.log('Realtime community_posts event:', payload);
        handlers.communityPosts?.(payload);
      }
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_streams',
      },
      (payload) => {
        console.log('Realtime live_streams event:', payload);
        handlers.liveStreams?.(payload);
      }
    );

  channel.subscribe((status, error) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Supabase Realtime WebSocket connected');
      return;
    }

    if (status === 'CHANNEL_ERROR') {
      console.error('❌ Supabase Realtime channel error:', error);
      return;
    }

    if (status === 'TIMED_OUT') {
      console.error('❌ Supabase Realtime connection timed out:', error);
      return;
    }

    if (status === 'CLOSED') {
      console.warn('⚠️ Supabase Realtime channel closed');
      return;
    }

    console.log('Supabase Realtime status:', status, error);
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}
