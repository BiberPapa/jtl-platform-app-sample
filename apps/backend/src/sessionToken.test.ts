import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionContextFromToken, resetSessionTokenKeyCacheForTests } from './sessionToken.js';
import { getAccessToken } from './accessToken.js';
import { importJWK, jwtVerify } from 'jose';

vi.mock('./accessToken.js', () => ({
  getAccessToken: vi.fn(),
}));

vi.mock('jose', () => ({
  importJWK: vi.fn(),
  jwtVerify: vi.fn(),
}));

type MockFetchResponse = {
  json: () => Promise<{ keys: Array<JsonWebKey & { kid?: string }> }>;
  ok: boolean;
  status: number;
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
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'key-1' }],
        }),
    } satisfies MockFetchResponse);

    vi.stubGlobal('fetch', fetchMock);
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

  it('tries the next jwks key when verification with the first key fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'other-key' }, { kid: 'target-key' }],
        }),
    } satisfies MockFetchResponse);

    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(importJWK).mockImplementation(key => Promise.resolve(key as never));
    vi.mocked(jwtVerify)
      .mockRejectedValueOnce(new Error('Signature verification failed.'))
      .mockResolvedValue({
        payload: {
          userId: 'user-1',
          tenantId: 'tenant-1',
        },
      } as never);

    await getSessionContextFromToken('session-token');

    expect(importJWK).toHaveBeenNthCalledWith(1, expect.objectContaining({ kid: 'other-key' }), 'EdDSA');
    expect(importJWK).toHaveBeenNthCalledWith(2, expect.objectContaining({ kid: 'target-key' }), 'EdDSA');
    expect(jwtVerify).toHaveBeenNthCalledWith(1, 'session-token', expect.objectContaining({ kid: 'other-key' }));
    expect(jwtVerify).toHaveBeenNthCalledWith(2, 'session-token', expect.objectContaining({ kid: 'target-key' }));
  });
});
