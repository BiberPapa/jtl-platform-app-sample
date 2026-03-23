import type { Request } from 'express';
import { getAccessToken } from '../accessToken.js';
import { getErpEndpoint } from '../config.js';
import { getConfiguredProxyLogLevel, logger, sanitizeHeaders, serializeLoggedBody } from '../logger.js';
import type { TenantContext } from '../tenantContext.js';

export type ErpProxyRequestContext = {
  requestId: string;
  inboundMethod: string;
  inboundPath: string;
  endpoint: string;
};

export type ErpProxyResponse = {
  status: number;
  headers: Headers;
  body: string;
};

export async function proxyErpRequest(req: Request, tenantContext: TenantContext, context: ErpProxyRequestContext): Promise<ErpProxyResponse> {
  const accessToken = await getAccessToken();
  const targetUrl = getErpEndpoint(context.endpoint);

  const options: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantContext.tenantId,
      ...(tenantContext.sessionToken ? { 'X-Session-Token': tenantContext.sessionToken } : {}),
    },
  };

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    options.body = JSON.stringify(req.body);
  }

  const startedAt = Date.now();

  logProxyRequest({
    ...context,
    method: req.method,
    targetUrl,
    headers: options.headers,
    body: options.body,
  });

  try {
    const erpResponse = await fetch(targetUrl, options);
    const responseText = erpResponse.status === 204 ? '' : await erpResponse.text();

    logProxyResponse({
      requestId: context.requestId,
      method: req.method,
      endpoint: context.endpoint,
      targetUrl,
      status: erpResponse.status,
      durationMs: Date.now() - startedAt,
      headers: erpResponse.headers,
      body: responseText,
    });

    return {
      status: erpResponse.status,
      headers: erpResponse.headers,
      body: responseText,
    };
  } catch (error) {
    logger.error(
      {
        event: 'erp_error',
        requestId: context.requestId,
        inboundMethod: context.inboundMethod,
        inboundPath: context.inboundPath,
        erpMethod: req.method,
        endpoint: context.endpoint,
        targetUrl,
        durationMs: Date.now() - startedAt,
        err: error,
      },
      'ERP proxy request failed.',
    );

    throw error;
  }
}

function logProxyRequest(input: {
  requestId: string;
  inboundMethod: string;
  inboundPath: string;
  method: string;
  endpoint: string;
  targetUrl: string;
  headers: HeadersInit | undefined;
  body: unknown;
}): void {
  const proxyLogLevel = getConfiguredProxyLogLevel();

  if (proxyLogLevel === 'off') {
    return;
  }

  logger.info(
    {
      event: 'erp_request',
      requestId: input.requestId,
      inboundMethod: input.inboundMethod,
      inboundPath: input.inboundPath,
      erpMethod: input.method,
      erpPath: `/erp/${input.endpoint}`,
      targetUrl: input.targetUrl,
      headers: sanitizeHeaders(input.headers),
      ...(proxyLogLevel === 'verbose' ? { body: serializeLoggedBody(input.body) } : {}),
    },
    'ERP request started.',
  );
}

function logProxyResponse(input: {
  requestId: string;
  method: string;
  endpoint: string;
  targetUrl: string;
  status: number;
  durationMs: number;
  headers: Headers;
  body: string;
}): void {
  const proxyLogLevel = getConfiguredProxyLogLevel();

  if (proxyLogLevel === 'off') {
    return;
  }

  logger.info(
    {
      event: 'erp_response',
      requestId: input.requestId,
      erpMethod: input.method,
      erpPath: `/erp/${input.endpoint}`,
      targetUrl: input.targetUrl,
      status: input.status,
      durationMs: input.durationMs,
      headers: sanitizeHeaders(input.headers),
      ...(proxyLogLevel === 'verbose' ? { body: serializeLoggedBody(input.body) } : {}),
    },
    'ERP request completed.',
  );
}
