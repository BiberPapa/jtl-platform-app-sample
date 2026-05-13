import cors from 'cors';
import express from 'express';
import { assignRequestContext } from './middleware/requestContext.js';
import { appInfoHandler } from './routes/appInfoRoute.js';
import { connectTenantHandler } from './routes/connectTenantRoute.js';
import { graphQlProxyHandler } from './routes/graphQlProxyRoute.js';
import { erpProxyHandler } from './routes/erpProxyRoute.js';
import { graphQlSchemaHandler } from './routes/graphQlSchemaRoute.js';
import { openApiHandler } from './routes/openApiRoute.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(assignRequestContext);

  app.get('/', (_req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'This backend serves as an ERP proxy. Access the app through JTL Hub or via manifest entry points.',
    });
  });

  app.get('/app-info', appInfoHandler);
  app.post('/connect-tenant', connectTenantHandler);
  app.get('/openapi.json', openApiHandler);
  app.get('/graphql/schema.graphql', graphQlSchemaHandler);
  app.post('/graphql', graphQlProxyHandler);
  app.all(/^\/erp\/(.+)$/, erpProxyHandler);

  return app;
}
