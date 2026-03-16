import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionContextFromToken, resetSessionTokenKeyCacheForTests } from './sessionToken.js';
import { getAccessToken } from './accessToken.js';
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';

vi.mock('./accessToken.js', () => ({
  getAccessToken: vi.fn(),
}));

vi.mock('jose', () => ({
  decodeProtectedHeader: vi.fn(),
  importJWK: vi.fn(),
  jwtVerify: vi.fn(),
}));

type MockFetchResponse = {
  json: () => Promise<{ keys: Array<JsonWebKey & { kid?: string }> }>;
};

describe('session token verification', () => {
  beforeEach(() => {
    resetSessionTokenKeyCacheForTests();
    vi.mocked(getAccessToken).mockResolvedValue('access-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    resetSessionTokenKeyCacheForTests();
  });

  it('reuses the imported public key for repeated requests with the same kid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'key-1' }],
        }),
    } satisfies MockFetchResponse);

    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(decodeProtectedHeader).mockReturnValue({ kid: 'key-1' });
    vi.mocked(importJWK).mockResolvedValue('public-key' as never);
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        userId: 'user-1',
        tenantId: 'tenant-1',
      },
    } as never);

    await getSessionContextFromToken('session-token-a');
    await getSessionContextFromToken('session-token-b');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(importJWK).toHaveBeenCalledTimes(1);
    expect(jwtVerify).toHaveBeenCalledTimes(2);
  });

  it('selects the matching jwks key by kid instead of taking the first key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'other-key' }, { kid: 'target-key' }],
        }),
    } satisfies MockFetchResponse);

    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(decodeProtectedHeader).mockReturnValue({ kid: 'target-key' });
    vi.mocked(importJWK).mockImplementation(key => Promise.resolve(key as never));
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        userId: 'user-1',
        tenantId: 'tenant-1',
      },
    } as never);

    await getSessionContextFromToken('session-token');

    expect(importJWK).toHaveBeenCalledWith(expect.objectContaining({ kid: 'target-key' }), 'EdDSA');
  });
});
