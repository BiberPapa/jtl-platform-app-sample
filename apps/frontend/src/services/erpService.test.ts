import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBridgeClient } from './appBridgeClient';
import { requestAuthorizationStatus, requestErpInfoStatus, requestPlaygroundRequest } from './erpService';

describe('requestErpInfoStatus', () => {
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

  it('loads the ERP status from /v2/info', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        headers: new Headers({
          'server-timing': 'erpapi-total;dur=5.222, backend-total;dur=8.75',
        }),
        json: {
          version: '2.0.0+Sha.e01a5a0',
          timestamp: '2026-03-19T13:16:15.8903775+01:00',
          tenant: 'eazybusiness',
          type: 'WAWI-Api',
        },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(performance, 'now').mockReturnValueOnce(100).mockReturnValueOnce(112);

    await expect(requestErpInfoStatus(appBridgeClient)).resolves.toEqual({
      reachable: true,
      tenantId: 'eazybusiness',
      version: '2.0.0+Sha.e01a5a0',
      totalTimeMs: 12,
      erpTimeMs: 5.222,
      infrastructureTimeMs: 8.75,
      frontendTimeMs: 3.25,
      errorMessage: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:50143/erp/v2/info', {
      headers: {
        'X-Session-Token': 'session-token',
      },
    });
  });

  it('returns an unavailable status when /v2/info fails', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: false,
        headers: new Headers({
          'server-timing': 'erpapi-total;dur=3.5, backend-total;dur=6.25',
        }),
        text: 'V2 info unavailable',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(performance, 'now').mockReturnValueOnce(200).mockReturnValueOnce(210);

    await expect(requestErpInfoStatus(appBridgeClient)).resolves.toEqual({
      reachable: false,
      tenantId: null,
      version: null,
      totalTimeMs: 10,
      erpTimeMs: 3.5,
      infrastructureTimeMs: 6.25,
      frontendTimeMs: 3.75,
      errorMessage: 'V2 info unavailable',
    });
  });
});

describe('requestAuthorizationStatus', () => {
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

  it('reports the app as authorized when /workers succeeds', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(requestAuthorizationStatus(appBridgeClient)).resolves.toEqual({
      state: 'authorized',
      message: null,
    });
  });

  it('reports the app as unauthorized when the response mentions authorization', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: false,
        text: 'Authorization error: access denied.',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(requestAuthorizationStatus(appBridgeClient)).resolves.toEqual({
      state: 'unauthorized',
      message: 'Authorization error: access denied.',
    });
  });

  it('reports a generic error when the workers check fails for another reason', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: false,
        text: 'Backend timeout',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(requestAuthorizationStatus(appBridgeClient)).resolves.toEqual({
      state: 'error',
      message: 'Backend timeout',
    });
  });
});

describe('requestPlaygroundRequest', () => {
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

  it('sends the selected method to the normalized route and reports response time', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        text: '{"workerId":"worker-42"}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(performance, 'now').mockReturnValueOnce(100).mockReturnValueOnce(137);

    await expect(requestPlaygroundRequest(appBridgeClient, { route: 'v1/worker', method: 'DELETE' })).resolves.toEqual({
      ok: true,
      status: 200,
      responseTimeMs: 37,
      route: '/v1/worker',
      method: 'DELETE',
      body: {
        workerId: 'worker-42',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:50143/erp/v1/worker', {
      method: 'DELETE',
      headers: {
        'X-Session-Token': 'session-token',
      },
    });
  });

  it('returns a visible empty body marker for empty playground responses', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 204,
        text: '',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(performance, 'now').mockReturnValueOnce(10).mockReturnValueOnce(15);

    await expect(requestPlaygroundRequest(appBridgeClient, { route: '/workers', method: 'GET' })).resolves.toEqual({
      ok: true,
      status: 204,
      responseTimeMs: 5,
      route: '/workers',
      method: 'GET',
      body: null,
    });
  });
});

function createResponse({
  ok,
  status,
  headers,
  json,
  text,
}: {
  ok: boolean;
  status?: number;
  headers?: Headers;
  json?: unknown;
  text?: string;
}): Response {
  return {
    ok,
    status: status ?? (ok ? 200 : 500),
    headers: headers ?? new Headers(),
    json: vi.fn(() => Promise.resolve(json)),
    text: vi.fn(() => Promise.resolve(text ?? '')),
  } as unknown as Response;
}
