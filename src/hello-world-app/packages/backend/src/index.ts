import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { getAccessToken } from './accessToken.js';
import { getErpEndpoint } from './config.js';
import { buildErpProxyRequest } from './erpProxy.js';
import { verifySessionTokenAndExtractPayload } from './sessionToken.js';

dotenv.config();

const app = express();
const PORT = 50143;

app.use(cors());
app.use(express.json());

/**
 * This is a simple example of how to maintain the mapping between a tenant ID from THIS application and the JTL Platform tenant ID.
 * In a real application, you would probably want to use a database or some other persistent storage.
 * The key is the tenant ID from THIS application and the value is the JTL Platform tenant ID.
 */
const myMappingDatabase = new Map<string, string>();

app.get('/', (_req, res) => {
  res.send('Hello from TypeScript + Express!');
});

type ConnectTenantRequest = Request<Record<string, never>, unknown, unknown>;
type ErpInfoRequest = Request<{ endpoint: string; tenantId: string }, unknown, unknown>;

function getSessionTokenFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const candidate = body as Record<string, unknown>;

  return typeof candidate.sessionToken === 'string' ? candidate.sessionToken : null;
}

app.post('/connect-tenant', async (req: ConnectTenantRequest, res: Response) => {
  const sessionToken = getSessionTokenFromBody(req.body);

  if (!sessionToken) {
    res.status(400).json({ error: 'sessionToken must be provided as a string.' });
    return;
  }

  const sessionTokenPayload = await verifySessionTokenAndExtractPayload(sessionToken);
  const tenantId = Date.now().toString();
  myMappingDatabase.set(tenantId, sessionTokenPayload.tenantId);

  res.send(`The tenant ID is ${tenantId} and the JTL Platform tenant ID is ${sessionTokenPayload.tenantId}`);
});

app.listen(PORT, () => {
  process.stdout.write(`Server running on http://localhost:${PORT}\n`);
});

app.all('/erp-info/:tenantId/:endpoint', async (req: ErpInfoRequest, res: Response) => {
  try {
    const proxyRequest = buildErpProxyRequest({
      method: req.method,
      tenantId: req.params.tenantId,
      endpoint: req.params.endpoint,
      body: req.body,
    });
    const accessToken = await getAccessToken();

    const options: RequestInit = {
      method: req.method,
      headers: {
        'X-Tenant-ID': proxyRequest.tenantId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = JSON.stringify(proxyRequest.body);
    }

    const erpInfoResponse = await fetch(getErpEndpoint(proxyRequest.endpoint), options);

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
