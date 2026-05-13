import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AppBridgeClient } from './appBridgeClient';
import { requestBackend } from './apiClient';

describe('requestBackend', () => {
  const getSessionTokenMock = vi.fn<() => Promise<string>>();
  const appBridgeClient: AppBridgeClient = {
    getSessionToken: getSessionTokenMock,
    setupCompleted: vi.fn<() => Promise<void>>(),
    getCurrentCustomerId: vi.fn<() => Promise<string>>(),
    subscribeToCustomerChanged: vi.fn(() => vi.fn()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getSessionTokenMock.mockResolvedValue('session-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the session token and parses JSON responses', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        text: '{"message":"ok"}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const response = await requestBackend({
      path: '/erp/v2/info',
      appBridgeClient,
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers).toBeInstanceOf(Headers);
    expect(response.text).toBe('{"message":"ok"}');
    expect(response.json).toEqual({ message: 'ok' });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/erp/v2/info', {
      method: 'GET',
      headers: {
        'X-Session-Token': 'session-token',
      },
    });
  });

  it('returns an empty text body for HEAD requests', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        text: 'ignored',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      requestBackend({
        path: '/erp/workers',
        method: 'HEAD',
        appBridgeClient,
      }),
    ).resolves.toMatchObject({
      text: '',
      json: null,
    });
  });

  it('throws when the session token is not available', async () => {
    const getSessionTokenMock = vi.fn<() => Promise<string>>().mockResolvedValueOnce('');
    const appBridgeClient: AppBridgeClient = {
      getSessionToken: getSessionTokenMock,
      setupCompleted: vi.fn<() => Promise<void>>(),
      getCurrentCustomerId: vi.fn<() => Promise<string>>(),
      subscribeToCustomerChanged: vi.fn(() => vi.fn()),
    };

    const requestPromise = requestBackend({
      path: '/app-info',
      appBridgeClient,
    });

    await expect(requestPromise).rejects.toThrow('A session token is required to access the backend.');
  });

  it('sends JSON request bodies for backend POST requests', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        text: '{"data":{"viewer":{"id":"1"}}}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await requestBackend({
      path: '/graphql',
      method: 'POST',
      body: '{"query":"{ viewer { id } }"}',
      appBridgeClient,
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/graphql', {
      method: 'POST',
      headers: {
        'X-Session-Token': 'session-token',
        'Content-Type': 'application/json',
      },
      body: '{"query":"{ viewer { id } }"}',
    });
  });
});

function createResponse({ ok, status, headers, text }: { ok: boolean; status?: number; headers?: Headers; text?: string }): Response {
  return {
    ok,
    status: status ?? (ok ? 200 : 500),
    headers: headers ?? new Headers(),
    text: vi.fn(() => Promise.resolve(text ?? '')),
  } as unknown as Response;
}
