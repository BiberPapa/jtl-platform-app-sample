import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAccessToken } from '../accessToken.js';
import { AppError } from '../errors/appError.js';
import { getErpEndpoint } from '../config.js';
import { logger } from '../logger.js';
import type { TenantContext } from '../tenantContext.js';
import { proxyErpRequest } from './erpProxy.js';

vi.mock('../accessToken.js', () => ({
  getAccessToken: vi.fn(),
}));

vi.mock('../config.js', () => ({
  getErpEndpoint: vi.fn(),
}));

vi.mock('../logger.js', () => ({
  getConfiguredProxyLogLevel: vi.fn(() => 'off'),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  sanitizeHeaders: vi.fn(() => ({})),
  serializeLoggedBody: vi.fn(body => body),
}));

describe('proxyErpRequest', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    sessionToken: 'session-token',
  };

  const requestContext = {
    requestId: 'request-1',
    inboundMethod: 'GET',
    inboundPath: '/erp/v2/info',
    endpoint: 'v2/info',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.mocked(getAccessToken).mockResolvedValue('access-token');
    vi.mocked(getErpEndpoint).mockReturnValue('https://api.qa.jtl-cloud.com/erp/v2/info');
  });

  it('forwards GET requests with auth and tenant headers', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: '{"result":"ok"}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await proxyErpRequest(createRequest({ method: 'GET' }), tenantContext, requestContext);

    expect(fetchMock).toHaveBeenCalledWith('https://api.qa.jtl-cloud.com/erp/v2/info', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'tenant-1',
        'X-Session-Token': 'session-token',
      },
    });
    expect(result).toMatchObject({
      status: 200,
      body: '{"result":"ok"}',
    });
  });

  it('serializes body for POST requests and omits session token header when empty', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: '{"id":"1"}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await proxyErpRequest(
      createRequest({ method: 'POST', body: { sku: 'A-1' } }),
      { ...tenantContext, sessionToken: '' },
      { ...requestContext, inboundMethod: 'POST', inboundPath: '/erp/v2/items', endpoint: 'v2/items' },
    );

    expect(fetchMock).toHaveBeenCalledWith('https://api.qa.jtl-cloud.com/erp/v2/info', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'tenant-1',
      },
      body: '{"sku":"A-1"}',
    });
  });

  it('returns null body for 204 responses', async () => {
    const textMock = vi.fn<() => Promise<string>>(() => Promise.resolve('ignored'));
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        status: 204,
        headers: new Headers(),
        text: 'ignored',
        textMock,
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await proxyErpRequest(createRequest({ method: 'DELETE' }), tenantContext, requestContext);

    expect(result.body).toBeNull();
    expect(textMock).not.toHaveBeenCalled();
  });

  it('returns binary payloads as Buffer for non-text content types', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        status: 200,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        binary: new Uint8Array([1, 2, 3]),
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await proxyErpRequest(createRequest({ method: 'GET' }), tenantContext, requestContext);

    expect(Buffer.isBuffer(result.body)).toBe(true);
    expect(result.body).toEqual(Buffer.from([1, 2, 3]));
  });

  it('wraps unexpected fetch failures in an AppError with 502 status', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('socket hang up')));

    await expect(proxyErpRequest(createRequest({ method: 'GET' }), tenantContext, requestContext)).rejects.toMatchObject({
      name: 'AppError',
      code: 'erp_proxy_failed',
      statusCode: 502,
      message: 'socket hang up',
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('rethrows AppError failures unchanged', async () => {
    const upstreamError = new AppError('The ERP request timed out.', {
      code: 'erp_timeout',
      publicMessage: 'The ERP request timed out.',
      statusCode: 504,
    });

    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValueOnce(upstreamError));

    await expect(proxyErpRequest(createRequest({ method: 'GET' }), tenantContext, requestContext)).rejects.toBe(upstreamError);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

function createRequest(input: { method: string; body?: unknown }): Request {
  return {
    method: input.method,
    body: input.body,
  } as Request;
}

function createResponse(input: {
  status: number;
  headers: Headers;
  text?: string;
  textMock?: ReturnType<typeof vi.fn<() => Promise<string>>>;
  binary?: Uint8Array;
}): Response {
  const textMock = input.textMock ?? vi.fn<() => Promise<string>>(() => Promise.resolve(input.text ?? ''));
  const binaryBuffer = input.binary ?? new Uint8Array([]);

  return {
    status: input.status,
    headers: input.headers,
    text: textMock,
    arrayBuffer: vi.fn(() => Promise.resolve(binaryBuffer.buffer as ArrayBuffer)),
  } as unknown as Response;
}
