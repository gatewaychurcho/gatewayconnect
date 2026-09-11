import type { SupabaseClient } from '@supabase/supabase-js'

type RealtimeHandlers = {
  directMessages?: (payload: unknown) => void
  posts?: (payload: unknown) => void
  communityPosts?: (payload: unknown) => void
  liveStreams?: (payload: unknown) => void
}

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
      (payload) => handlers.directMessages?.(payload)
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
      },
      (payload) => handlers.posts?.(payload)
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_posts',
      },
      (payload) => handlers.communityPosts?.(payload)
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_streams',
      },
      (payload) => handlers.liveStreams?.(payload)
    )

    .subscribe((status) => {
      console.log('Supabase Realtime:', status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}
