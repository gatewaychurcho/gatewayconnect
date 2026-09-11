/**
 * Gateway Connect — Central Application Configuration & Environment Variables
 * Single source of truth for all client-side and serverless environment variables.
 */

// Helper to safely extract environment variables across Vite and Node.js environments
function getEnv(key: string, fallback = ''): string {
  // 1. Check Vite / client import.meta.env
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key] !== undefined && meta.env[key] !== '') {
      return String(meta.env[key]).trim();
    }
  } catch {
    // ignore
  }

  // 2. Check Node / Serverless process.env
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined && process.env[key] !== '') {
      return String(process.env[key]).trim();
    }
  } catch {
    // ignore
  }

  return fallback;
}

export const CONFIG = {
  // ---------------------------------------------------------------------------
  // Supabase Configuration (Database, Realtime & Auth)
  // ---------------------------------------------------------------------------
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL', 'https://csinlqdcqdgcssdanvsr.supabase.co'),
  SUPABASE_ANON_KEY: getEnv(
    'VITE_SUPABASE_ANON_KEY',
    'sb_publishable_TJvwQ_lcZtUL0hHOm1yJmA_rfhpBKEX'
  ),

  // ---------------------------------------------------------------------------
  // Live WebSocket Gateway URL (Optional external hub)
  // ---------------------------------------------------------------------------
  LIVE_WS_URL: getEnv('VITE_LIVE_WS_URL', ''),

  // ---------------------------------------------------------------------------
  // Application Host URL
  // ---------------------------------------------------------------------------
  APP_URL: getEnv('APP_URL') || getEnv('VITE_APP_URL', 'https://gatewayconnect.joedaniels.org/'),

  // ---------------------------------------------------------------------------
  // Paynow Zimbabwe Gateway Configuration (Serverless / Backend)
  // ---------------------------------------------------------------------------
  PAYNOW_INTEGRATION_ID: getEnv('PAYNOW_INTEGRATION_ID', '12345'),
  PAYNOW_INTEGRATION_KEY: getEnv('PAYNOW_INTEGRATION_KEY', 'abcdef-1234-5678-90ab-cdef12345678'),
  PAYNOW_MERCHANT_EMAIL: getEnv('PAYNOW_MERCHANT_EMAIL', 'gatewaychurchzim@gmail.com'),
  PAYNOW_RETURN_URL: getEnv('PAYNOW_RETURN_URL', 'https://gatewayconnect.joedaniels.org/payment/success'),
  PAYNOW_RESULT_URL: getEnv('PAYNOW_RESULT_URL', 'https://gatewayconnect.joedaniels.org/api/paynow/webhook'),

  // ---------------------------------------------------------------------------
  // Server Port & Runtime Environment
  // ---------------------------------------------------------------------------
  PORT: Number(getEnv('PORT') || getEnv('LIVE_PORT') || 8787),
  IS_DEV: Boolean((import.meta as any)?.env?.DEV),
  IS_PROD: Boolean((import.meta as any)?.env?.PROD),
  MODE: getEnv('MODE', 'production'),
} as const;

export const CONSTANTS = CONFIG;
export default CONFIG;
