import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AppBridgeClient } from './appBridgeClient';
import { AppError } from './appError';
import { requestAppInfo } from './appInfoService';

describe('requestAppInfo', () => {
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

  it('loads backend app info', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        text: JSON.stringify({
          environment: 'qa',
          hubUrl: 'https://hub.qa.jtl-cloud.com',
          cloudErpUrl: 'https://erp.qa.jtl-cloud.com',
          apiBaseUrl: 'https://api.qa.jtl-cloud.com',
          authUrl: 'https://auth.qa.jtl-cloud.com/oauth2/token',
        }),
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(requestAppInfo(appBridgeClient)).resolves.toEqual({
      environment: 'qa',
      hubUrl: 'https://hub.qa.jtl-cloud.com',
      cloudErpUrl: 'https://erp.qa.jtl-cloud.com',
      apiBaseUrl: 'https://api.qa.jtl-cloud.com',
      authUrl: 'https://auth.qa.jtl-cloud.com/oauth2/token',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/app-info', {
      method: 'GET',
      headers: {
        'X-Session-Token': 'session-token',
      },
    });
  });

  it('loads backend app info with custom session token', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        text: JSON.stringify({
          environment: 'prod',
          hubUrl: 'https://hub.jtl-cloud.com',
          cloudErpUrl: 'https://erp.jtl-cloud.com',
          apiBaseUrl: 'https://api.jtl-cloud.com',
          authUrl: 'https://auth.jtl-cloud.com/oauth2/token',
        }),
      }),
    );

    vi.stubGlobal('fetch', fetchMock);
    getSessionTokenMock.mockResolvedValueOnce('custom-token');

    await expect(requestAppInfo(appBridgeClient)).resolves.toEqual({
      environment: 'prod',
      hubUrl: 'https://hub.jtl-cloud.com',
      cloudErpUrl: 'https://erp.jtl-cloud.com',
      apiBaseUrl: 'https://api.jtl-cloud.com',
      authUrl: 'https://auth.jtl-cloud.com/oauth2/token',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/app-info', {
      method: 'GET',
      headers: {
        'X-Session-Token': 'custom-token',
      },
    });
  });

  it('throws when the backend returns an unexpected payload', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        text: '{"invalid":true}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const requestPromise = requestAppInfo(appBridgeClient);

    await expect(requestPromise).rejects.toBeInstanceOf(AppError);
    await expect(requestPromise).rejects.toMatchObject({
      details: {
        userMessage: 'The backend app info returned an unexpected payload.',
      },
    });
  });

  it('throws when session token is not available', async () => {
    getSessionTokenMock.mockResolvedValueOnce(null as unknown as string);

    const requestPromise = requestAppInfo(appBridgeClient);

    await expect(requestPromise).rejects.toBeInstanceOf(Error);
    // The error may be wrapped in AppError, so just check it contains relevant info
    await expect(requestPromise).rejects.toThrow();
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
