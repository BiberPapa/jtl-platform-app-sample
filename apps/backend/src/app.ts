import cors from 'cors';
import express from 'express';
import { assignRequestContext } from './middleware/requestContext.js';
import { appInfoHandler } from './routes/appInfoRoute.js';
import { connectTenantHandler } from './routes/connectTenantRoute.js';
import { erpProxyHandler } from './routes/erpProxyRoute.js';
import { openApiHandler } from './routes/openApiRoute.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(assignRequestContext);

  app.get('/', (_req, res) => {
    res.send('Hello from TypeScript + Express!');
  });

  app.get('/app-info', appInfoHandler);
  app.post('/connect-tenant', connectTenantHandler);
  app.get('/openapi.json', openApiHandler);
  app.all(/^\/erp\/(.+)$/, erpProxyHandler);

  return app;
}
