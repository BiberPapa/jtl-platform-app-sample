import { importJWK, jwtVerify } from 'jose';
import { getJwksEndpoint } from './config.js';
import { getAccessToken } from './accessToken.js';

export type SessionContext = {
  userId: string;
  tenantId: string;
};

type JsonWebKeyWithId = JsonWebKey & {
  kid?: string;
};

type JwkSetResponse = {
  keys?: JsonWebKeyWithId[];
};

let publicKeysPromise: Promise<Array<Awaited<ReturnType<typeof importJWK>>>> | null = null;

/**
 * Validates a session token and returns the user and tenant information required by the backend.
 */
export async function getSessionContextFromToken(sessionToken: string): Promise<SessionContext> {
  const publicKeys = await getPublicKeys();
  let lastVerificationError: unknown = null;

  for (const publicKey of publicKeys) {
    try {
      const { payload } = await jwtVerify(sessionToken, publicKey);

      if (typeof payload.userId !== 'string' || typeof payload.tenantId !== 'string') {
        throw new Error('The session token payload is missing required claims.');
      }

      return {
        userId: payload.userId,
        tenantId: payload.tenantId,
      };
    } catch (error) {
      lastVerificationError = error;
    }
  }

  throw lastVerificationError instanceof Error ? lastVerificationError : new Error('The session token could not be validated.');
}

export function resetSessionTokenKeyCacheForTests(): void {
  publicKeysPromise = null;
}

async function fetchJwks(accessToken: string): Promise<JwkSetResponse> {
  const response = await fetch(getJwksEndpoint(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return (await response.json()) as JwkSetResponse;
}

async function importPublicKeys(): Promise<Array<Awaited<ReturnType<typeof importJWK>>>> {
  const accessToken = await getAccessToken();
  const jwks = await fetchJwks(accessToken);
  const keys = jwks.keys ?? [];

  if (keys.length === 0) {
    throw new Error('The JWKS endpoint did not return a signing key.');
  }

  return await Promise.all(keys.map(async key => await importJWK(key, 'EdDSA')));
}

async function getPublicKeys(): Promise<Array<Awaited<ReturnType<typeof importJWK>>>> {
  if (publicKeysPromise) {
    return await publicKeysPromise;
  }

  publicKeysPromise = importPublicKeys().catch(error => {
    publicKeysPromise = null;
    throw error;
  });

  return await publicKeysPromise;
}
