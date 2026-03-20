import type { RequestHandler } from 'express';
import { copyProxyResponseHeaders } from '../http/proxyHeaders.js';
import { getSessionTokenFromHeaders } from '../http/sessionTokenHeader.js';
import { getRequestId } from '../middleware/requestContext.js';
import { transformOpenApiDocument } from '../services/openApiDocument.js';
import { proxyErpRequest } from '../services/erpProxy.js';

export const openApiHandler: RequestHandler = async (req, res) => {
  const requestId = getRequestId(res);
  const sessionToken = getSessionTokenFromHeaders(req.headers);

  if (!sessionToken) {
    res.status(400).json({ error: 'The X-Session-Token header must be provided.' });
    return;
  }

  const startedAt = performance.now();

  try {
    const erpResponse = await proxyErpRequest(req, sessionToken, {
      requestId,
      inboundMethod: req.method,
      inboundPath: req.originalUrl,
      endpoint: 'openapi.json',
    });

    const transformedDocument = transformOpenApiDocument(erpResponse.body);

    copyProxyResponseHeaders(erpResponse.headers, res, performance.now() - startedAt);
    res.status(erpResponse.status).send(transformedDocument);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch ERP OpenAPI document',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
