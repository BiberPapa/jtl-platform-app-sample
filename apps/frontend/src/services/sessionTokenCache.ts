/**
 * Session Token Cache with automatic refresh before expiry
 *
 * Tokens are short-lived (typically 5-15 minutes). Caching prevents unnecessary
 * bridge calls on every API request. If multiple requests happen in quick
 * succession, they all reuse the same token.
 */

import type { AppBridgeClient } from './appBridgeClient';

type CacheState = {
  token: string;
  expiresAt: number;
};

let cache: CacheState | null = null;

const REFRESH_BUFFER_MS = 30_000; // Refresh 30 seconds before expiry

/**
 * Get a session token, using cache if available and not expiring soon.
 * Falls back to fetching a fresh token if cache is stale.
 */
export async function getCachedSessionToken(appBridgeClient: AppBridgeClient): Promise<string> {
  const now = Date.now();

  if (cache && now < cache.expiresAt - REFRESH_BUFFER_MS) {
    return cache.token;
  }

  const token = await appBridgeClient.getSessionToken();

  // Decode JWT payload to extract expiration
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) throw new Error('Invalid token format');

    // Convert base64url to base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    const payload = JSON.parse(jsonPayload) as { exp?: number };
    cache = {
      token,
      expiresAt: (payload.exp ?? 0) * 1000, // Convert from Unix seconds to milliseconds
    };
  } catch {
    // If token decode fails, cache anyway with 5-minute fallback
    cache = {
      token,
      expiresAt: now + 5 * 60 * 1000,
    };
  }

  return token;
}

/**
 * Invalidate the cache (e.g., after a 401 error).
 * Next call to getCachedSessionToken will fetch a fresh token.
 */
export function invalidateSessionTokenCache(): void {
  cache = null;
}

/**
 * Reset cache for testing purposes.
 */
export function resetSessionTokenCacheForTests(): void {
  cache = null;
}
