import type { Request } from 'express';
import { getAccessToken } from '../accessToken.js';
import { getGraphQlEndpoint } from '../config.js';
import { getConfiguredProxyLogLevel, logger, sanitizeHeaders, serializeLoggedBody } from '../logger.js';
import type { TenantContext } from '../tenantContext.js';

export type GraphQlProxyRequestContext = {
  requestId: string;
  inboundMethod: string;
  inboundPath: string;
};

export type GraphQlProxyResponse = {
  status: number;
  headers: Headers;
  body: string;
};

export async function proxyGraphQlRequest(
  req: Request,
  tenantContext: TenantContext,
  context: GraphQlProxyRequestContext,
): Promise<GraphQlProxyResponse> {
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
    logger.error(
      {
        event: 'graphql_error',
        requestId: context.requestId,
        inboundMethod: context.inboundMethod,
        inboundPath: context.inboundPath,
        graphqlMethod: req.method,
        targetUrl,
        durationMs: Date.now() - startedAt,
        err: error,
      },
      'GraphQL proxy request failed.',
    );

    throw error;
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
