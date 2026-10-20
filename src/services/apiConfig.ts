/**
 * Unified API Configuration & Resolution
 * Ensures Android WebViews, local environments, and mobile clients
 * reliably hit the production backend at https://gatewayconnect.joedaniels.org
 */
export const getApiUrl = (endpoint: string): string => {
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.origin &&
    window.location.origin.includes('joedaniels.org')
  ) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `https://gatewayconnect.joedaniels.org${cleanEndpoint}`;
};
