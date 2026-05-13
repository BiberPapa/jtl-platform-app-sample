import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/appError.js';
import type { TenantContext } from '../tenantContext.js';
import { erpProxyHandler } from './erpProxyRoute.js';

const {
  copyProxyResponseHeadersMock,
  sendProxyResponseMock,
  getSessionTokenFromHeadersMock,
  getRequestIdMock,
  proxyErpRequestMock,
  resolveTenantContextMock,
} = vi.hoisted(() => ({
  copyProxyResponseHeadersMock: vi.fn(),
  sendProxyResponseMock: vi.fn(),
  getSessionTokenFromHeadersMock: vi.fn(),
  getRequestIdMock: vi.fn(),
  proxyErpRequestMock: vi.fn(),
  resolveTenantContextMock: vi.fn(),
}));

vi.mock('../http/proxyHeaders.js', () => ({
  copyProxyResponseHeaders: copyProxyResponseHeadersMock,
}));

vi.mock('../http/proxyResponse.js', () => ({
  sendProxyResponse: sendProxyResponseMock,
}));

vi.mock('../http/sessionTokenHeader.js', () => ({
  getSessionTokenFromHeaders: getSessionTokenFromHeadersMock,
}));

vi.mock('../middleware/requestContext.js', () => ({
  getRequestId: getRequestIdMock,
}));

vi.mock('../services/erpProxy.js', () => ({
  proxyErpRequest: proxyErpRequestMock,
}));

vi.mock('../tenantContext.js', () => ({
  resolveTenantContext: resolveTenantContextMock,
}));

describe('erpProxyHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionTokenFromHeadersMock.mockReturnValue('session-token');
    getRequestIdMock.mockReturnValue('request-id-1');
    resolveTenantContextMock.mockResolvedValue({
      sessionToken: 'session-token',
      tenantId: 'tenant-1',
      userId: 'user-1',
    } satisfies TenantContext);
    proxyErpRequestMock.mockResolvedValue({
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      body: '{"ok":true}',
    });
  });

  it('proxies a valid ERP request and forwards response metadata', async () => {
    const request = createRequest({
      headers: { 'x-session-token': 'session-token' },
      method: 'GET',
      originalUrl: '/erp/v2/info',
      params: { 0: 'v2/info' },
    });
    const response = createResponse();

    await erpProxyHandler(request as Request, response as Response, vi.fn());

    expect(getSessionTokenFromHeadersMock).toHaveBeenCalledWith(request.headers);
    expect(resolveTenantContextMock).toHaveBeenCalledWith('session-token');
    expect(proxyErpRequestMock).toHaveBeenCalledWith(request, expect.objectContaining({ tenantId: 'tenant-1' }), {
      endpoint: 'v2/info',
      inboundMethod: 'GET',
      inboundPath: '/erp/v2/info',
      requestId: 'request-id-1',
    });
    expect(copyProxyResponseHeadersMock).toHaveBeenCalledWith(expect.any(Headers), response, expect.any(Number));
    expect(sendProxyResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        body: '{"ok":true}',
      }),
      response,
    );
  });

  it('returns 400 when endpoint path is missing', async () => {
    const request = createRequest({
      headers: { 'x-session-token': 'session-token' },
      method: 'GET',
      originalUrl: '/erp',
      params: {},
    });
    const response = createResponse();

    await erpProxyHandler(request as Request, response as Response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch ERP info',
      message: 'An ERP endpoint path must be provided.',
    });
    expect(resolveTenantContextMock).not.toHaveBeenCalled();
    expect(proxyErpRequestMock).not.toHaveBeenCalled();
  });

  it('maps AppError failures from tenant resolution to the declared status', async () => {
    resolveTenantContextMock.mockRejectedValueOnce(
      new AppError('The X-Session-Token header is required.', {
        code: 'missing_session_token',
        publicMessage: 'A session token is required.',
        statusCode: 400,
      }),
    );

    const request = createRequest({
      headers: {},
      method: 'GET',
      originalUrl: '/erp/v2/info',
      params: { 0: 'v2/info' },
    });
    const response = createResponse();

    await erpProxyHandler(request as Request, response as Response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch ERP info',
      message: 'The X-Session-Token header is required.',
    });
  });

  it('returns 500 when an unexpected proxy failure occurs', async () => {
    proxyErpRequestMock.mockRejectedValueOnce(new Error('ERP connection reset by peer'));

    const request = createRequest({
      headers: { 'x-session-token': 'session-token' },
      method: 'GET',
      originalUrl: '/erp/customers',
      params: { 0: 'customers' },
    });
    const response = createResponse();

    await erpProxyHandler(request as Request, response as Response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch ERP info',
      message: 'ERP connection reset by peer',
    });
  });
});

function createRequest(input: {
  headers: Request['headers'];
  method: string;
  originalUrl: string;
  params: Record<string, string>;
}): Pick<Request, 'headers' | 'method' | 'originalUrl' | 'params'> {
  return {
    headers: input.headers,
    method: input.method,
    originalUrl: input.originalUrl,
    params: input.params,
  };
}

function createResponse(): Pick<Response, 'json' | 'locals' | 'status'> {
  const response = {
    locals: {
      requestId: 'request-id-1',
    },
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response;
}
