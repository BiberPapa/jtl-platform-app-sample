import cors from 'cors';
import express from 'express';
import { assignRequestContext } from './middleware/requestContext.js';
import { connectTenantHandler } from './routes/connectTenantRoute.js';
import { erpProxyHandler } from './routes/erpProxyRoute.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(assignRequestContext);

  app.get('/', (_req, res) => {
    res.send('Hello from TypeScript + Express!');
  });

  app.post('/connect-tenant', connectTenantHandler);
  app.all(/^\/erp\/(.+)$/, erpProxyHandler);

  return app;
}
