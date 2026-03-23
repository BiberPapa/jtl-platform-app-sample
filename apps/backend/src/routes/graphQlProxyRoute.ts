import type { RequestHandler } from 'express';
import { copyProxyResponseHeaders } from '../http/proxyHeaders.js';
import { getSessionTokenFromHeaders } from '../http/sessionTokenHeader.js';
import { getRequestId } from '../middleware/requestContext.js';
import { proxyGraphQlRequest } from '../services/graphQlProxy.js';
import { resolveTenantContext } from '../tenantContext.js';

export const graphQlProxyHandler: RequestHandler = async (req, res) => {
  const requestId = getRequestId(res);
  const sessionToken = getSessionTokenFromHeaders(req.headers);
  const startedAt = performance.now();

  try {
    const tenantContext = await resolveTenantContext(sessionToken);
    const graphQlResponse = await proxyGraphQlRequest(req, tenantContext, {
      requestId,
      inboundMethod: req.method,
      inboundPath: req.originalUrl,
    });

    copyProxyResponseHeaders(graphQlResponse.headers, res, performance.now() - startedAt);
    res.status(graphQlResponse.status).send(graphQlResponse.body);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute GraphQL request',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
