import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from './storageService';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = StorageService.getSupabaseConfig();
  if (config.isLiveConnected && config.url && config.anonKey && config.url.startsWith('https://')) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(config.url, config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
      } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
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

export interface SupabaseHealthResult {
  connected: boolean;
  projectUrl: string;
  latencyMs: number;
  message: string;
  error?: string;
}

/**
 * Performs a live connectivity check against the user's Supabase project
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthResult> {
  const config = StorageService.getSupabaseConfig();
  const startTime = Date.now();

  if (!config.url || !config.anonKey) {
    return {
      connected: false,
      projectUrl: config.url || 'Not configured',
      latencyMs: 0,
      message: 'Supabase URL or Anon Key is missing.'
    };
  }

  try {
    // Ping Supabase REST endpoint to verify network reachability and key validity
    const pingEndpoint = `${config.url.replace(/\/$/, '')}/rest/v1/`;
    const res = await fetch(pingEndpoint, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });

    const latencyMs = Date.now() - startTime;

    if (res.ok || res.status === 200) {
      return {
        connected: true,
        projectUrl: config.url,
        latencyMs,
        message: `Successfully connected to Supabase (${config.url}). Ping: ${latencyMs}ms.`
      };
    } else {
      const errBody = await res.text().catch(() => '');
      return {
        connected: false,
        projectUrl: config.url,
        latencyMs,
        message: `Supabase responded with status ${res.status}.`,
        error: errBody || `HTTP ${res.status} error`
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      connected: false,
      projectUrl: config.url,
      latencyMs,
      message: `Connection failed: ${err.message || 'Network error'}`,
      error: err.message
    };
  }
}
