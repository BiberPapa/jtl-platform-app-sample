import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBridgeClient } from './appBridgeClient';
import { getBackendErrorMessage, requestBackend } from './apiClient';

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
});

describe('getBackendErrorMessage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prefers structured backend error payloads', () => {
    expect(
      getBackendErrorMessage(
        {
          text: 'Plain text fallback',
          json: { error: 'Structured backend error' },
        },
        'Fallback error',
      ),
    ).toBe('Structured backend error');
  });

  it('falls back to response text and then to the provided fallback message', () => {
    expect(
      getBackendErrorMessage(
        {
          text: 'Plain text fallback',
          json: null,
        },
        'Fallback error',
      ),
    ).toBe('Plain text fallback');

    expect(
      getBackendErrorMessage(
        {
          text: '',
          json: null,
        },
        'Fallback error',
      ),
    ).toBe('Fallback error');
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
