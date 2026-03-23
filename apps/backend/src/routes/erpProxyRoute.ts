import type { RequestHandler } from 'express';
import { copyProxyResponseHeaders } from '../http/proxyHeaders.js';
import { getSessionTokenFromHeaders } from '../http/sessionTokenHeader.js';
import { getRequestId } from '../middleware/requestContext.js';
import { proxyErpRequest } from '../services/erpProxy.js';
import { resolveTenantContext } from '../tenantContext.js';

export const erpProxyHandler: RequestHandler = async (req, res) => {
  const requestId = getRequestId(res);
  const sessionToken = getSessionTokenFromHeaders(req.headers);

  const endpoint = req.params[0];

  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    res.status(400).json({ error: 'An ERP endpoint path must be provided.' });
    return;
  }

  const startedAt = performance.now();

  try {
    const tenantContext = await resolveTenantContext(sessionToken);
    const erpResponse = await proxyErpRequest(req, tenantContext, {
      requestId,
      inboundMethod: req.method,
      inboundPath: req.originalUrl,
      endpoint,
    });

    copyProxyResponseHeaders(erpResponse.headers, res, performance.now() - startedAt);
    res.status(erpResponse.status).send(erpResponse.body);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch ERP info',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
