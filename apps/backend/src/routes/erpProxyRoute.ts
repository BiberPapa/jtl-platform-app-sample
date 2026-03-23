import { copyProxyResponseHeaders } from '../http/proxyHeaders.js';
import { sendProxyResponse } from '../http/proxyResponse.js';
import { getSessionTokenFromHeaders } from '../http/sessionTokenHeader.js';
import { AppError } from '../errors/appError.js';
import { getRequestId } from '../middleware/requestContext.js';
import { proxyErpRequest } from '../services/erpProxy.js';
import { resolveTenantContext } from '../tenantContext.js';
import { createRouteHandler } from './routeHandler.js';

export const erpProxyHandler = createRouteHandler({ errorMessage: 'Failed to fetch ERP info', route: '/erp/*' }, async (req, res) => {
  const sessionToken = getSessionTokenFromHeaders(req.headers);

  const endpoint = req.params[0];

  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new AppError('An ERP endpoint path must be provided.', {
      code: 'missing_erp_endpoint',
      publicMessage: 'An ERP endpoint path must be provided.',
      statusCode: 400,
    });
  }

  const requestId = getRequestId(res);
  const startedAt = performance.now();
  const tenantContext = await resolveTenantContext(sessionToken);
  const erpResponse = await proxyErpRequest(req, tenantContext, {
    requestId,
    inboundMethod: req.method,
    inboundPath: req.originalUrl,
    endpoint,
  });

  copyProxyResponseHeaders(erpResponse.headers, res, performance.now() - startedAt);
  sendProxyResponse(erpResponse, res);
});
