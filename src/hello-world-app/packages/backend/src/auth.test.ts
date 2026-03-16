import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateAccessTokenExpiryEpochMs, getAccessToken, resetAccessTokenCacheForTests } from './accessToken.js';

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

type MockFetchResponse = {
  json: () => Promise<TokenResponse>;
  ok: boolean;
  status: number;
};

function createUnsignedJwt(expEpochSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: expEpochSeconds })).toString('base64url');

  return `${header}.${payload}.`;
}

describe('auth token caching', () => {
  beforeEach(() => {
    process.env.CLIENT_ID = 'client-id';
    process.env.CLIENT_SECRET = 'client-secret';
    resetAccessTokenCacheForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-13T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetAccessTokenCacheForTests();
  });

  it('reuses a cached token while expires_in is still valid', async () => {
    const token = createUnsignedJwt(Math.floor(Date.now() / 1000) + 3600);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          access_token: token,
          expires_in: 120,
        } satisfies TokenResponse),
    });

    vi.stubGlobal('fetch', fetchMock);

    expect(await getAccessToken()).toBe(token);
    expect(await getAccessToken()).toBe(token);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes the token after the cached entry expires', async () => {
    const firstToken = createUnsignedJwt(Math.floor(Date.now() / 1000) + 3600);
    const secondToken = createUnsignedJwt(Math.floor(Date.now() / 1000) + 7200);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            access_token: firstToken,
            expires_in: 60,
          } satisfies TokenResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            access_token: secondToken,
            expires_in: 60,
          } satisfies TokenResponse),
      });

    vi.stubGlobal('fetch', fetchMock);

    expect(await getAccessToken()).toBe(firstToken);

    vi.advanceTimersByTime(31_000);

    expect(await getAccessToken()).toBe(secondToken);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to the exp claim when expires_in is missing', () => {
    const expEpochSeconds = Math.floor(Date.now() / 1000) + 90;
    const token = createUnsignedJwt(expEpochSeconds);

    expect(calculateAccessTokenExpiryEpochMs(token, undefined, Date.now())).toBe((expEpochSeconds - 30) * 1000);
  });

  it('issues only one refresh for concurrent requests', async () => {
    const token = createUnsignedJwt(Math.floor(Date.now() / 1000) + 3600);
    let resolveResponse: ((value: MockFetchResponse) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<MockFetchResponse>(resolve => {
          resolveResponse = resolve;
        }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const firstRequest = getAccessToken();
    const secondRequest = getAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(resolveResponse).toBeDefined();

    resolveResponse?.({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          access_token: token,
          expires_in: 120,
        } satisfies TokenResponse),
    });

    const [firstResult, secondResult] = await Promise.all([firstRequest, secondRequest]);

    expect(firstResult).toBe(token);
    expect(secondResult).toBe(token);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
