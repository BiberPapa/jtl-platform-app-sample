import { copyProxyResponseHeaders } from '../http/proxyHeaders.js';
import { sendProxyResponse } from '../http/proxyResponse.js';
import { getSessionTokenFromHeaders } from '../http/sessionTokenHeader.js';
import { getRequestId } from '../middleware/requestContext.js';
import { proxyGraphQlRequest } from '../services/graphQlProxy.js';
import { resolveTenantContext } from '../tenantContext.js';
import { createRouteHandler } from './routeHandler.js';

export const graphQlProxyHandler = createRouteHandler({ errorMessage: 'Failed to execute GraphQL request', route: '/graphql' }, async (req, res) => {
  const requestId = getRequestId(res);
  const sessionToken = getSessionTokenFromHeaders(req.headers);
  const startedAt = performance.now();
  const tenantContext = await resolveTenantContext(sessionToken);
  const graphQlResponse = await proxyGraphQlRequest(req, tenantContext, {
    requestId,
    inboundMethod: req.method,
    inboundPath: req.originalUrl,
  });

  copyProxyResponseHeaders(graphQlResponse.headers, res, performance.now() - startedAt);
  sendProxyResponse(graphQlResponse, res);
});
