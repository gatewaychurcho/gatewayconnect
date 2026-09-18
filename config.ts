/**
 * Gateway Connect — Central Application Configuration & Environment Variables
 * Single source of truth for every environment variable used by the Vite client
 * bundle, the Vercel serverless functions and the build tooling (vite.config.ts).
 *
 * HOW TO ADD A VARIABLE
 *   1. Add its raw key to `ENV_KEYS` below (this is the countable manifest).
 *   2. Add a typed field to `CONFIG` that reads it through `getEnv`.
 *   3. Import `CONFIG` wherever you need it — never read `process.env` or
 *      `import.meta.env` directly anywhere else in the codebase.
 */

// Safely reads an environment variable across Vite (import.meta.env),
// Node / Vercel serverless (process.env) and plain Node build tooling.
export function getEnv(key: string, fallback = ''): string {
  // 1. Vite / client import.meta.env
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key] !== undefined && meta.env[key] !== '') {
      return String(meta.env[key]).trim();
    }
  } catch {
    // ignore — import.meta.env is unavailable in plain Node
  }

  // 2. Node / serverless / build process.env
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined && process.env[key] !== '') {
      return String(process.env[key]).trim();
    }
  } catch {
    // ignore
  }

  return fallback;
}

// Safely reads a boolean flag from Vite's import.meta.env (client only).
function getViteFlag(key: string): boolean {
  try {
    return Boolean((import.meta as any)?.env?.[key]);
  } catch {
    return false;
  }
}

/**
 * Complete manifest of environment variables this app understands.
 * Keeping this list here makes the environment auditable and countable:
 * `.env.example` mirrors it and every reader goes through `CONFIG`.
 */
export const ENV_KEYS = [
  // Supabase (client + server)
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  // Live WebSocket gateway
  'VITE_LIVE_WS_URL',
  // Application host
  'APP_URL',
  'VITE_APP_URL',
  // Paynow Zimbabwe
  'PAYNOW_INTEGRATION_ID',
  'PAYNOW_INTEGRATION_KEY',
  'PAYNOW_MERCHANT_EMAIL',
  'PAYNOW_RETURN_URL',
  'PAYNOW_RESULT_URL',
  // Runtime / build tooling
  'PORT',
  'LIVE_PORT',
  'MODE',
  'DISABLE_HMR',
] as const;

export type EnvKey = (typeof ENV_KEYS)[number];

export const CONFIG = {
  // ---------------------------------------------------------------------------
  // Supabase Configuration (Database, Realtime & Auth)
  // ---------------------------------------------------------------------------
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL', 'https://kgdyynefwnmwlwnnqgxx.supabase.co'),
  // NOTE: must be a JWT (legacy anon key). New-style sb_publishable_ keys
  // subscribe to Realtime but never receive postgres_changes events.
  SUPABASE_ANON_KEY: getEnv(
    'VITE_SUPABASE_ANON_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZHl5bmVmd25td2x3bm5xZ3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjU3ODksImV4cCI6MjEwNDAwMTc4OX0.Y6QIzBbtHq1VEZcVJQGD3FvfdaEENXY8B-xAI_YqJh4'
  ),

  // ---------------------------------------------------------------------------
  // Live WebSocket Gateway URL (Optional external hub)
  // ---------------------------------------------------------------------------
  LIVE_WS_URL: getEnv('VITE_LIVE_WS_URL', 'wss://gatewayconnect.onrender.com/live'),

  // ---------------------------------------------------------------------------
  // Application Host URL
  // ---------------------------------------------------------------------------
  APP_URL: getEnv('APP_URL') || getEnv('VITE_APP_URL', 'https://gatewayconnect.joedaniels.org/'),

  // ---------------------------------------------------------------------------
  // Paynow Zimbabwe Gateway Configuration (Serverless / Backend)
  // ---------------------------------------------------------------------------
  PAYNOW_INTEGRATION_ID: getEnv('PAYNOW_INTEGRATION_ID', ''),
  PAYNOW_INTEGRATION_KEY: getEnv('PAYNOW_INTEGRATION_KEY', ''),
  PAYNOW_MERCHANT_EMAIL: getEnv('PAYNOW_MERCHANT_EMAIL', 'gatewaychurchzim@gmail.com'),
  PAYNOW_RETURN_URL: getEnv('PAYNOW_RETURN_URL', 'https://gatewayconnect.joedaniels.org/payment/success'),
  PAYNOW_RESULT_URL: getEnv('PAYNOW_RESULT_URL', 'https://gatewayconnect.joedaniels.org/api/paynow/webhook'),

  // ---------------------------------------------------------------------------
  // Server Port & Runtime Environment
  // ---------------------------------------------------------------------------
  PORT: Number(getEnv('PORT') || getEnv('LIVE_PORT') || 8787),
  IS_DEV: getViteFlag('DEV'),
  IS_PROD: getViteFlag('PROD'),
  MODE: getEnv('MODE', 'production'),

  // ---------------------------------------------------------------------------
  // Build Tooling
  // ---------------------------------------------------------------------------
  // When 'true', Vite HMR and file watching are disabled (used in AI Studio).
  DISABLE_HMR: getEnv('DISABLE_HMR', 'false'),
} as const;

export const CONSTANTS = CONFIG;
export default CONFIG;
