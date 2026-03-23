import type { Request } from 'express';
import { getAccessToken } from '../accessToken.js';
import { getGraphQlEndpoint } from '../config.js';
import type { ProxyResponse } from '../http/proxyResponse.js';
import { getConfiguredProxyLogLevel, logger, sanitizeHeaders, serializeLoggedBody } from '../logger.js';
import type { TenantContext } from '../tenantContext.js';
import { AppError } from '../errors/appError.js';

export type GraphQlProxyRequestContext = {
  requestId: string;
  inboundMethod: string;
  inboundPath: string;
};

export async function proxyGraphQlRequest(req: Request, tenantContext: TenantContext, context: GraphQlProxyRequestContext): Promise<ProxyResponse> {
  const accessToken = await getAccessToken();
  const targetUrl = getGraphQlEndpoint();
  const requestBody = JSON.stringify(req.body ?? {});
  const options: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantContext.tenantId,
      ...(tenantContext.sessionToken ? { 'X-Session-Token': tenantContext.sessionToken } : {}),
    },
    body: requestBody,
  };

  const startedAt = Date.now();

  logGraphQlRequest({
    ...context,
    targetUrl,
    headers: options.headers,
    body: requestBody,
  });

  try {
    const graphQlResponse = await fetch(targetUrl, options);
    const responseText = await graphQlResponse.text();

    logGraphQlResponse({
      requestId: context.requestId,
      targetUrl,
      status: graphQlResponse.status,
      durationMs: Date.now() - startedAt,
      headers: graphQlResponse.headers,
      body: responseText,
    });

    return {
      status: graphQlResponse.status,
      headers: graphQlResponse.headers,
      body: responseText,
    };
  } catch (error) {
    const proxyError =
      error instanceof AppError
        ? error
        : new AppError(error instanceof Error ? error.message : 'GraphQL proxy request failed.', {
            cause: error,
            code: 'graphql_proxy_failed',
            publicMessage: 'The GraphQL request could not be completed.',
            statusCode: 502,
          });

    logger.error(
      {
        event: 'graphql_error',
        requestId: context.requestId,
        inboundMethod: context.inboundMethod,
        inboundPath: context.inboundPath,
        graphqlMethod: req.method,
        targetUrl,
        durationMs: Date.now() - startedAt,
        err: proxyError,
      },
      'GraphQL proxy request failed.',
    );

    throw proxyError;
  }
}

function logGraphQlRequest(input: {
  requestId: string;
  inboundMethod: string;
  inboundPath: string;
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
      event: 'graphql_request',
      requestId: input.requestId,
      inboundMethod: input.inboundMethod,
      inboundPath: input.inboundPath,
      graphqlMethod: 'POST',
      graphqlPath: '/graphql',
      targetUrl: input.targetUrl,
      headers: sanitizeHeaders(input.headers),
      ...(proxyLogLevel === 'verbose' ? { body: serializeLoggedBody(input.body) } : {}),
    },
    'GraphQL request started.',
  );
}

function logGraphQlResponse(input: {
  requestId: string;
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
      event: 'graphql_response',
      requestId: input.requestId,
      graphqlMethod: 'POST',
      graphqlPath: '/graphql',
      targetUrl: input.targetUrl,
      status: input.status,
      durationMs: input.durationMs,
      headers: sanitizeHeaders(input.headers),
      ...(proxyLogLevel === 'verbose' ? { body: serializeLoggedBody(input.body) } : {}),
    },
    'GraphQL request completed.',
  );
}
