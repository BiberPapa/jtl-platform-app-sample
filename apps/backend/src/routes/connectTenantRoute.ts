import { getSessionTokenFromHeaders } from '../http/sessionTokenHeader.js';
import { resolveTenantContext } from '../tenantContext.js';
import { createRouteHandler } from './routeHandler.js';

export const connectTenantHandler = createRouteHandler({ errorMessage: 'Failed to connect tenant', route: '/connect-tenant' }, async (req, res) => {
  const sessionToken = getSessionTokenFromHeaders(req.headers);
  await resolveTenantContext(sessionToken);

  res.json({ message: 'Tenant connected successfully.' });
});
