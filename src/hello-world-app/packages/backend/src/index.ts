import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { getAccessToken } from './accessToken.js';
import { getErpEndpoint } from './config.js';
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
    const sessionToken = getSessionTokenFromHeaders(req.headers);

    if (!sessionToken) {
      res.status(400).json({ error: 'The X-Session-Token header must be provided.' });
      return;
    }

    await getSessionContextFromToken(sessionToken);

    res.json({ message: 'Tenant connected successfully.' });
  });

  app.all(/^\/erp-info\/(.+)$/, async (req: Request, res: Response) => {
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
          'X-Tenant-ID': sessionContext.tenantId,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        options.body = JSON.stringify(req.body);
      }

      const erpInfoResponse = await fetch(getErpEndpoint(endpoint), options);

      if (erpInfoResponse.ok) {
        const data: unknown = await erpInfoResponse.json();
        res.json(data);
      } else {
        const errorText = await erpInfoResponse.text();
        res.status(erpInfoResponse.status).send(errorText);
      }
    } catch (error) {
      console.error('Error in /erp-info route:', error);
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
