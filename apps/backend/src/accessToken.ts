import { getAuthEndpoint } from './config.js';

type AccessTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type CachedAccessToken = {
  expiresAtEpochMs: number;
  value: string;
};

// Refresh a bit early so requests do not start using a token right before it expires.
const tokenSafetyBufferMs = 30_000;

let cachedAccessToken: CachedAccessToken | null = null;
// Parallel callers share the same refresh request instead of fetching multiple tokens.
let inFlightTokenRefresh: Promise<string> | null = null;

function getRequiredEnv(name: 'CLIENT_ID' | 'CLIENT_SECRET'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be defined in the backend environment.`);
  }

  return value;
}

function getValidCachedAccessToken(nowEpochMs: number): string | null {
  if (!cachedAccessToken || cachedAccessToken.expiresAtEpochMs <= nowEpochMs) {
    cachedAccessToken = null;
    return null;
  }

  return cachedAccessToken.value;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  return Buffer.from(padded, 'base64').toString('utf8');
}

function getExpiryFromAccessTokenPayloadEpochMs(accessToken: string): number | null {
  const [, payloadSegment] = accessToken.split('.');

  if (!payloadSegment) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as { exp?: unknown };

    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

/**
 * Calculates when a fetched access token should stop being reused from cache.
 * Prefers the auth server's `expires_in` value and only decodes the token payload as a fallback.
 */
export function calculateAccessTokenExpiryEpochMs(accessToken: string, expiresInSeconds?: number, nowEpochMs = Date.now()): number | null {
  if (typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds)) {
    const expiresAtEpochMs = nowEpochMs + expiresInSeconds * 1000 - tokenSafetyBufferMs;
    return expiresAtEpochMs > nowEpochMs ? expiresAtEpochMs : null;
  }

  const accessTokenExpiryEpochMs = getExpiryFromAccessTokenPayloadEpochMs(accessToken);

  if (!accessTokenExpiryEpochMs) {
    return null;
  }

  const expiresAtEpochMs = accessTokenExpiryEpochMs - tokenSafetyBufferMs;

  return expiresAtEpochMs > nowEpochMs ? expiresAtEpochMs : null;
}

/**
 * Returns a cached access token when possible and otherwise refreshes it once for all concurrent callers.
 */
export async function getAccessToken(): Promise<string> {
  const cachedToken = getValidCachedAccessToken(Date.now());

  if (cachedToken) {
    return cachedToken;
  }

  if (!inFlightTokenRefresh) {
    inFlightTokenRefresh = fetchAccessToken().finally(() => {
      inFlightTokenRefresh = null;
    });
  }

  return await inFlightTokenRefresh;
}

async function fetchAccessToken(): Promise<string> {
  const clientId = getRequiredEnv('CLIENT_ID');
  const clientSecret = getRequiredEnv('CLIENT_SECRET');
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(getAuthEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authString}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  const data = (await response.json()) as AccessTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to fetch access token (${response.status}): ${data.error ?? 'unknown error'}`);
  }

  const expiresAtEpochMs = calculateAccessTokenExpiryEpochMs(data.access_token, data.expires_in);

  if (expiresAtEpochMs) {
    cachedAccessToken = {
      value: data.access_token,
      expiresAtEpochMs,
    };
  }

  return data.access_token;
}

export function resetAccessTokenCacheForTests(): void {
  cachedAccessToken = null;
  inFlightTokenRefresh = null;
}
