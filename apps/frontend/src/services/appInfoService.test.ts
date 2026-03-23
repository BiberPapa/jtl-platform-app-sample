import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDummyAppBridgeClient, type AppBridgeClient } from './appBridgeClient';
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
          nohubTenantId: 'tenant-1',
          isNohubConfigured: true,
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
      nohubTenantId: 'tenant-1',
      isNohubConfigured: true,
      hubUrl: 'https://hub.qa.jtl-cloud.com',
      cloudErpUrl: 'https://erp.qa.jtl-cloud.com',
      apiBaseUrl: 'https://api.qa.jtl-cloud.com',
      authUrl: 'https://auth.qa.jtl-cloud.com/oauth2/token',
    });
  });

  it('loads backend app info through the dummy bridge in local mode', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        text: JSON.stringify({
          environment: 'prod',
          nohubTenantId: null,
          isNohubConfigured: false,
          hubUrl: 'https://hub.jtl-cloud.com',
          cloudErpUrl: 'https://erp.jtl-cloud.com',
          apiBaseUrl: 'https://api.jtl-cloud.com',
          authUrl: 'https://auth.jtl-cloud.com/oauth2/token',
        }),
      }),
    );

    vi.stubGlobal('fetch', fetchMock);
    const appBridgeClient = createDummyAppBridgeClient();

    await expect(requestAppInfo(appBridgeClient)).resolves.toEqual({
      environment: 'prod',
      nohubTenantId: null,
      isNohubConfigured: false,
      hubUrl: 'https://hub.jtl-cloud.com',
      cloudErpUrl: 'https://erp.jtl-cloud.com',
      apiBaseUrl: 'https://api.jtl-cloud.com',
      authUrl: 'https://auth.jtl-cloud.com/oauth2/token',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/app-info', {
      method: 'GET',
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

    await expect(requestAppInfo(appBridgeClient)).rejects.toThrow('The backend app info returned an unexpected payload.');
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
