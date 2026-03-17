import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { getAccessToken } from './accessToken.js';
import { getErpEndpoint } from './config.js';
import { rewriteOpenApiResponse } from './openApiDocument.js';
import { getSessionContextFromToken } from './sessionToken.js';

dotenv.config();

const PORT = 50143;
const sessionTokenHeaderName = 'x-session-token';

function getSessionTokenFromHeaders(headers: Request['headers']): string | null {
  const candidate = headers[sessionTokenHeaderName];

  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }

  return null;
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.send('Hello from TypeScript + Express!');
  });

  app.post('/connect-tenant', async (req: Request, res: Response) => {
    try {
      const sessionToken = getSessionTokenFromHeaders(req.headers);

      if (!sessionToken) {
        res.status(400).json({ error: 'The X-Session-Token header must be provided.' });
        return;
      }

      await getSessionContextFromToken(sessionToken);

      res.json({ message: 'Tenant connected successfully.' });
    } catch (error) {
      console.error('Error in /connect-tenant route:', error);
      res.status(500).json({
        error: 'Failed to connect tenant',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.all(/^\/erp\/(.+)$/, async (req: Request, res: Response) => {
    try {
      const sessionToken = getSessionTokenFromHeaders(req.headers);

      if (!sessionToken) {
        res.status(400).json({ error: 'The X-Session-Token header must be provided.' });
        return;
      }

      const endpoint = req.params[0];

      if (typeof endpoint !== 'string' || endpoint.length === 0) {
        res.status(400).json({ error: 'An ERP endpoint path must be provided.' });
        return;
      }

      const sessionContext = await getSessionContextFromToken(sessionToken);
      const accessToken = await getAccessToken();

      const options: RequestInit = {
        method: req.method,
        headers: {
          'X-Session-Token': sessionToken,
          'X-Tenant-ID': sessionContext.tenantId,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        options.body = JSON.stringify(req.body);
      }

      const erpInfoResponse = await fetch(getErpEndpoint(endpoint), options);
      const contentType = erpInfoResponse.headers.get('content-type');
      const responseBody = erpInfoResponse.status === 204 ? '' : await erpInfoResponse.text();
      const rewrittenOpenApiResponse = rewriteOpenApiResponse({
        endpoint,
        method: req.method,
        contentType,
        body: responseBody,
      });

      if (rewrittenOpenApiResponse) {
        if (rewrittenOpenApiResponse.contentType) {
          res.set('Content-Type', rewrittenOpenApiResponse.contentType);
        }

        res.status(erpInfoResponse.status).send(rewrittenOpenApiResponse.body);
        return;
      }

      if (contentType) {
        res.set('Content-Type', contentType);
      }

      res.status(erpInfoResponse.status).send(responseBody);
    } catch (error) {
      console.error('Error in /erp route:', error);
      res.status(500).json({
        error: 'Failed to fetch ERP info',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return app;
}

export const app = createApp();

if (!process.env.VITEST) {
  app.listen(PORT, () => {
    process.stdout.write(`Server running on http://localhost:${PORT}\n`);
  });
}
