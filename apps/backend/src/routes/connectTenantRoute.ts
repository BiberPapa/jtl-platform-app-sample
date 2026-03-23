import type { RequestHandler } from 'express';
import { getSessionTokenFromHeaders } from '../http/sessionTokenHeader.js';
import { logger } from '../logger.js';
import { getRequestId } from '../middleware/requestContext.js';
import { resolveTenantContext } from '../tenantContext.js';

export const connectTenantHandler: RequestHandler = async (req, res) => {
  const requestId = getRequestId(res);

  try {
    const sessionToken = getSessionTokenFromHeaders(req.headers);
    await resolveTenantContext(sessionToken);

    res.json({ message: 'Tenant connected successfully.' });
  } catch (error) {
    logger.error(
      {
        event: 'route_error',
        requestId,
        route: '/connect-tenant',
        err: error,
      },
      'Failed to connect tenant.',
    );
    res.status(500).json({
      error: 'Failed to connect tenant',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
