import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from './storageService';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = StorageService.getSupabaseConfig();
  if (config.isLiveConnected && config.url && config.anonKey && config.url.startsWith('https://')) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(config.url, config.anonKey);
      } catch (e) {
        console.error('Failed to init Supabase client', e);
        return null;
      }
    }
    return supabaseInstance;
  }
  return null;
}

export function resetSupabaseInstance(): void {
  supabaseInstance = null;
}
