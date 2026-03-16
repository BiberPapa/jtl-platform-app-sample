import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';
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

const publicKeyCache = new Map<string, Promise<Awaited<ReturnType<typeof importJWK>>>>();

/**
 * Validates a session token and returns the user and tenant information required by the backend.
 */
export async function getSessionContextFromToken(sessionToken: string): Promise<SessionContext> {
  const keyId = getKeyIdFromSessionToken(sessionToken);
  const publicKey = await getPublicKeyForKeyId(keyId);
  const { payload } = await jwtVerify(sessionToken, publicKey);

  if (typeof payload.userId !== 'string' || typeof payload.tenantId !== 'string') {
    throw new Error('The session token payload is missing required claims.');
  }

  return {
    userId: payload.userId,
    tenantId: payload.tenantId,
  };
}

export function resetSessionTokenKeyCacheForTests(): void {
  publicKeyCache.clear();
}

function getKeyIdFromSessionToken(sessionToken: string): string {
  const { kid } = decodeProtectedHeader(sessionToken);

  if (typeof kid !== 'string' || kid.length === 0) {
    throw new Error('The session token header is missing a key ID.');
  }

  return kid;
}

async function fetchJwks(accessToken: string): Promise<JwkSetResponse> {
  const response = await fetch(getJwksEndpoint(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return (await response.json()) as JwkSetResponse;
}

async function importPublicKeyForKeyId(keyId: string): Promise<Awaited<ReturnType<typeof importJWK>>> {
  const accessToken = await getAccessToken();
  const jwks = await fetchJwks(accessToken);
  const key = jwks.keys?.find(candidate => candidate.kid === keyId);

  if (!key) {
    throw new Error(`The JWKS endpoint did not return a signing key for kid "${keyId}".`);
  }

  return await importJWK(key, 'EdDSA');
}

async function getPublicKeyForKeyId(keyId: string): Promise<Awaited<ReturnType<typeof importJWK>>> {
  const cachedPublicKey = publicKeyCache.get(keyId);

  if (cachedPublicKey) {
    return await cachedPublicKey;
  }

  const publicKeyPromise = importPublicKeyForKeyId(keyId).catch(error => {
    publicKeyCache.delete(keyId);
    throw error;
  });

  publicKeyCache.set(keyId, publicKeyPromise);

  return await publicKeyPromise;
}
