import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getAccessTokenMock, getSessionContextFromTokenMock } = vi.hoisted(() => ({
  getAccessTokenMock: vi.fn<() => Promise<string>>(),
  getSessionContextFromTokenMock: vi.fn<(sessionToken: string) => Promise<{ tenantId: string; userId: string }>>(),
}));

vi.mock('./accessToken.js', () => ({
  getAccessToken: getAccessTokenMock,
}));

vi.mock('./sessionToken.js', () => ({
  getSessionContextFromToken: getSessionContextFromTokenMock,
}));

const originalEnv = { ...process.env };

function captureJsonLogs() {
  const chunks: string[] = [];
  vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  }) as typeof process.stdout.write);

  return {
    getLogs(): Array<Record<string, unknown>> {
      return chunks
        .flatMap(chunk => chunk.split('\n'))
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .flatMap(line => {
          try {
            return [JSON.parse(line) as Record<string, unknown>];
          } catch {
            return [];
          }
        });
    },
  };
}

type ParsedOpenApiDocument = {
  info?: Record<string, unknown>;
  openapi?: string;
  paths?: Record<
    string,
    Record<
      string,
      {
        description?: string;
        parameters?: Array<{ description?: string; in?: string; name?: string }>;
        responses?: Record<string, { description?: string }>;
        summary?: string;
        tags?: string[];
      }
    >
  >;
  tags?: Array<{ description?: string; name?: string }>;
};

function parseOpenApiDocument(documentText: string): ParsedOpenApiDocument {
  const normalizedDocumentText = documentText.charCodeAt(0) === 0xfeff ? documentText.slice(1) : documentText;

  return JSON.parse(normalizedDocumentText) as ParsedOpenApiDocument;
}

describe('backend routes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
    process.env.DOTENV_CONFIG_QUIET = 'true';
    delete process.env.LOG_LEVEL;
    delete process.env.ERP_PROXY_LOG_LEVEL;
    delete process.env.ERP_PROXY_LOG_BODY_MAX_LENGTH;
    delete process.env.DEBUG_ERP_PROXY;
    getAccessTokenMock.mockResolvedValue('access-token');
    getSessionContextFromTokenMock.mockResolvedValue({
      tenantId: 'platform-tenant-id',
      userId: 'user-id',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns a bad request when the setup route is missing a session token', async () => {
    process.env.NOHUB_TENANT_ID = '';
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/connect-tenant');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to connect tenant',
      message: 'Either the X-Session-Token header or NOHUB_TENANT_ID must be provided.',
    });
  });

  it('uses NOHUB_TENANT_ID for setup requests without a session token', async () => {
    process.env.NOHUB_TENANT_ID = 'fallback-tenant';
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/connect-tenant');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Tenant connected successfully.' });
    expect(getSessionContextFromTokenMock).not.toHaveBeenCalled();
  });

  it('returns backend app info with normalized prod defaults', async () => {
    process.env.API_ENVIRONMENT = '';
    process.env.NOHUB_TENANT_ID = '';
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/app-info');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      environment: 'prod',
      nohubTenantId: null,
      isNohubConfigured: false,
      hubUrl: 'https://hub.jtl-cloud.com',
      cloudErpUrl: 'https://erp.jtl-cloud.com',
      apiBaseUrl: 'https://api.jtl-cloud.com',
      authUrl: 'https://auth.jtl-cloud.com/oauth2/token',
    });
  });

  it('returns backend app info with qa environment and configured NOHUB tenant', async () => {
    process.env.API_ENVIRONMENT = 'qa';
    process.env.NOHUB_TENANT_ID = 'fallback-tenant-id';
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/app-info');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      environment: 'qa',
      nohubTenantId: 'fallback-tenant-id',
      isNohubConfigured: true,
      hubUrl: 'https://hub.qa.jtl-cloud.com',
      cloudErpUrl: 'https://erp.qa.jtl-cloud.com',
      apiBaseUrl: 'https://api.qa.jtl-cloud.com',
      authUrl: 'https://auth.qa.jtl-cloud.com/oauth2/token',
    });
  });

  it('normalizes unsupported backend environments to prod in app info', async () => {
    process.env.API_ENVIRONMENT = 'beta';
    process.env.NOHUB_TENANT_ID = '';
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/app-info');

    expect(response.status).toBe(200);
    expect((response.body as { environment: string }).environment).toBe('prod');
  });

  it('returns structured success for a valid setup request', async () => {
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/connect-tenant').set('X-Session-Token', 'session-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Tenant connected successfully.' });
    expect(getSessionContextFromTokenMock).toHaveBeenCalledWith('session-token');
  });

  it('returns a structured error when setup validation throws', async () => {
    getSessionContextFromTokenMock.mockRejectedValueOnce(new Error('Session token validation failed.'));
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/connect-tenant').set('X-Session-Token', 'session-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to connect tenant',
      message: 'Session token validation failed.',
    });
  });

  it('returns an error for ERP requests when neither session token nor NOHUB_TENANT_ID is available', async () => {
    process.env.NOHUB_TENANT_ID = '';
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp/customers');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to fetch ERP info',
      message: 'Either the X-Session-Token header or NOHUB_TENANT_ID must be provided.',
    });
  });

  it('uses NOHUB_TENANT_ID and omits the session token header for ERP requests without a session token', async () => {
    process.env.NOHUB_TENANT_ID = 'fallback-tenant-id';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json; charset=utf-8',
      }),
      text: () => Promise.resolve('{"result":"ok"}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp/customers');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ result: 'ok' });
    expect(getSessionContextFromTokenMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('https://api.jtl-cloud.com/erp/customers', {
      method: 'GET',
      headers: {
        'X-Tenant-ID': 'fallback-tenant-id',
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
    });
  });

  it('uses the validated tenant and forwards nested ERP endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({
        'content-type': 'application/json; charset=utf-8',
      }),
      text: () => Promise.resolve('{"result":"ok"}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/erp/customers/addresses').set('X-Session-Token', 'session-token').send({ id: 7 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ result: 'ok' });
    expect(getSessionContextFromTokenMock).toHaveBeenCalledWith('session-token');
    expect(fetchMock).toHaveBeenCalledWith('https://api.jtl-cloud.com/erp/customers/addresses', {
      method: 'POST',
      headers: {
        'X-Session-Token': 'session-token',
        'X-Tenant-ID': 'platform-tenant-id',
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 7 }),
    });
  });

  it('uses NOHUB_TENANT_ID for GraphQL requests without a session token', async () => {
    process.env.NOHUB_TENANT_ID = 'fallback-tenant-id';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json; charset=utf-8',
      }),
      text: () => Promise.resolve('{"data":{"viewer":{"id":"1"}}}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/graphql').send({
      query: '{ viewer { id } }',
      variables: null,
      operationName: 'Viewer',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { viewer: { id: '1' } } });
    expect(getSessionContextFromTokenMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('https://api.jtl-cloud.com/erp/v2/graphql', {
      method: 'POST',
      headers: {
        'X-Tenant-ID': 'fallback-tenant-id',
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ viewer { id } }',
        variables: null,
        operationName: 'Viewer',
      }),
    });
  });

  it('uses the validated tenant and session token for GraphQL requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json; charset=utf-8',
      }),
      text: () => Promise.resolve('{"data":{"viewer":{"id":"1"}}}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp())
      .post('/graphql')
      .set('X-Session-Token', 'session-token')
      .send({
        query: '{ viewer { id } }',
        variables: { includeMeta: true },
        operationName: 'Viewer',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { viewer: { id: '1' } } });
    expect(getSessionContextFromTokenMock).toHaveBeenCalledWith('session-token');
    expect(fetchMock).toHaveBeenCalledWith('https://api.jtl-cloud.com/erp/v2/graphql', {
      method: 'POST',
      headers: {
        'X-Session-Token': 'session-token',
        'X-Tenant-ID': 'platform-tenant-id',
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ viewer { id } }',
        variables: { includeMeta: true },
        operationName: 'Viewer',
      }),
    });
  });

  it('returns an error for GraphQL requests when neither session token nor NOHUB_TENANT_ID is available', async () => {
    process.env.NOHUB_TENANT_ID = '';
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/graphql').send({
      query: '{ viewer { id } }',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to execute GraphQL request',
      message: 'Either the X-Session-Token header or NOHUB_TENANT_ID must be provided.',
    });
  });

  it('does not emit ERP proxy logs when ERP_PROXY_LOG_LEVEL is off', async () => {
    process.env.ERP_PROXY_LOG_LEVEL = 'off';
    const logs = captureJsonLogs();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve('{"result":"ok"}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    await request(createApp()).get('/erp/customers').set('X-Session-Token', 'session-token');

    expect(logs.getLogs().filter(entry => String(entry.event).startsWith('erp_'))).toEqual([]);
  });

  it('emits structured basic ERP logs with masked headers and timing', async () => {
    process.env.ERP_PROXY_LOG_LEVEL = 'basic';
    const logs = captureJsonLogs();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
        date: 'Wed, 19 Mar 2026 09:22:01 GMT',
      }),
      text: () => Promise.resolve('{"result":"ok"}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    await request(createApp()).get('/erp/customers').set('X-Session-Token', 'session-token');

    const erpLogs = logs.getLogs().filter(entry => String(entry.event).startsWith('erp_'));
    const requestLog = erpLogs.find(entry => entry.event === 'erp_request');
    const responseLog = erpLogs.find(entry => entry.event === 'erp_response');

    expect(erpLogs).toHaveLength(2);
    expect(requestLog).toBeDefined();
    expect(responseLog).toBeDefined();
    if (!requestLog || !responseLog) {
      throw new Error('Expected ERP request and response logs to be present.');
    }
    expect(requestLog.event).toBe('erp_request');
    expect(requestLog.erpMethod).toBe('GET');
    expect(requestLog.inboundPath).toBe('/erp/customers');
    expect(requestLog.targetUrl).toBe('https://api.jtl-cloud.com/erp/customers');
    expect(requestLog.requestId).toEqual(expect.any(String));
    expect(requestLog.headers).toEqual({
      'X-Session-Token': '<redacted>',
      'X-Tenant-ID': 'platform-tenant-id',
      Authorization: '<redacted>',
      'Content-Type': 'application/json',
    });
    expect(requestLog.body).toBeUndefined();

    expect(responseLog.event).toBe('erp_response');
    expect(responseLog.requestId).toBe(requestLog.requestId);
    expect(responseLog.status).toBe(200);
    expect(responseLog.durationMs).toEqual(expect.any(Number));
    expect(responseLog.body).toBeUndefined();
  });

  it('defaults to basic ERP logging outside production without explicit log level', async () => {
    delete process.env.NODE_ENV;
    const logs = captureJsonLogs();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      text: () => Promise.resolve('{"result":"ok"}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    await request(createApp()).get('/erp/customers').set('X-Session-Token', 'session-token');

    const erpLogs = logs.getLogs().filter(entry => String(entry.event).startsWith('erp_'));

    expect(erpLogs.map(entry => entry.event)).toEqual(['erp_request', 'erp_response']);
  });

  it('emits verbose ERP logs with truncated bodies', async () => {
    process.env.ERP_PROXY_LOG_LEVEL = 'verbose';
    process.env.ERP_PROXY_LOG_BODY_MAX_LENGTH = '12';
    const logs = captureJsonLogs();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      text: () => Promise.resolve('{"message":"response-payload"}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    await request(createApp()).post('/erp/customers').set('X-Session-Token', 'session-token').send({ message: 'request-payload' });

    const erpLogs = logs.getLogs().filter(entry => String(entry.event).startsWith('erp_'));
    const requestLog = erpLogs.find(entry => entry.event === 'erp_request');
    const responseLog = erpLogs.find(entry => entry.event === 'erp_response');

    expect(erpLogs).toHaveLength(2);
    expect(requestLog).toBeDefined();
    expect(responseLog).toBeDefined();
    if (!requestLog || !responseLog) {
      throw new Error('Expected ERP request and response logs to be present.');
    }
    expect(requestLog.body).toEqual({
      kind: 'text',
      value: '{"message":"',
      truncated: true,
      originalLength: 29,
      loggedLength: 12,
    });
    expect(responseLog.body).toEqual({
      kind: 'text',
      value: '{"message":"',
      truncated: true,
      originalLength: 30,
      loggedLength: 12,
    });
  });

  it('emits an erp_error log with requestId when the ERP request throws', async () => {
    process.env.ERP_PROXY_LOG_LEVEL = 'basic';
    const logs = captureJsonLogs();
    const fetchMock = vi.fn().mockRejectedValue(new Error('ERP unavailable'));

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp/customers').set('X-Session-Token', 'session-token');

    expect(response.status).toBe(500);

    const errorLog = logs.getLogs().find(entry => entry.event === 'erp_error');

    expect(errorLog).toBeDefined();
    expect(errorLog?.requestId).toEqual(expect.any(String));
    expect(errorLog?.targetUrl).toBe('https://api.jtl-cloud.com/erp/customers');
    expect(errorLog?.durationMs).toEqual(expect.any(Number));
  });

  it('preserves no-content responses from ERP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      text: () => Promise.resolve(''),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp/customers').set('X-Session-Token', 'session-token');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  it('forwards only whitelisted ERP response headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json; charset=utf-8',
        'content-language': 'de-DE',
        date: 'Wed, 19 Mar 2026 09:22:01 GMT',
        'api-supported-versions': '2.0',
        'server-timing': 'erpapi-total;dur=5.222',
        etag: '"version-1"',
        'last-modified': 'Wed, 19 Mar 2026 09:22:01 GMT',
        'cache-control': 'no-cache',
        'content-encoding': 'gzip',
        connection: 'keep-alive',
        'content-length': '999',
        'transfer-encoding': 'chunked',
      }),
      text: () => Promise.resolve('{"result":"ok"}'),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp/customers').set('X-Session-Token', 'session-token');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json; charset=utf-8');
    expect(response.headers['content-language']).toBe('de-DE');
    expect(response.headers.date).toBe('Wed, 19 Mar 2026 09:22:01 GMT');
    expect(response.headers['api-supported-versions']).toBe('2.0');
    expect(response.headers['server-timing']).toMatch(/^erpapi-total;dur=5\.222, backend-total;dur=\d+\.\d{3}$/);
    expect(response.headers['access-control-expose-headers']).toContain('api-supported-versions');
    expect(response.headers['access-control-expose-headers']).toContain('server-timing');
    expect(response.headers['access-control-expose-headers']).toContain('date');
    expect(response.headers.etag).not.toBe('"version-1"');
    expect(response.headers['last-modified']).toBeUndefined();
    expect(response.headers['cache-control']).toBeUndefined();
    expect(response.headers['content-encoding']).toBeUndefined();
    expect(response.headers.connection).not.toBe('keep-alive');
    expect(response.headers['transfer-encoding']).toBeUndefined();
  });

  it('returns the local OpenAPI document with transformed tags and normalized texts', async () => {
    const { createApp } = await import('./index.js');
    const sourceDocumentText = await readFile(new URL('./assets/openapi.json', import.meta.url), 'utf8');
    const sourceDocument = parseOpenApiDocument(sourceDocumentText);

    const response = await request(createApp()).get('/openapi.json');
    const responseBody = response.body as ParsedOpenApiDocument;
    const tagNames = (responseBody.tags?.map(tag => tag.name) ?? []).filter((tagName): tagName is string => Boolean(tagName));
    const availabilitiesOperation = responseBody.paths?.['/v2/availabilities']?.get;
    const authenticationOperation = responseBody.paths?.['/v2/authentication']?.post;
    const itemsOperation = responseBody.paths?.['/v2/items']?.post;
    const workersOperation = responseBody.paths?.['/v2/workers']?.get;
    const infoOperation = responseBody.paths?.['/v2/info']?.get;

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(responseBody.openapi).toBe(sourceDocument.openapi);
    expect(tagNames).toEqual([...tagNames].sort((left, right) => left.localeCompare(right)));
    expect(tagNames).toContain('Synchronizations');
    expect(tagNames).toContain('Item Configurations');
    expect(tagNames).toContain('API Information');
    expect(tagNames).not.toContain('worker');
    expect(tagNames).not.toContain('wms');
    expect(tagNames).not.toContain('WawiApp');
    expect(tagNames).not.toContain('appRegistration');
    expect(tagNames).not.toContain('login');
    expect(tagNames).not.toContain('logout');
    expect(responseBody.paths?.['/v2/wawiapp/customers']).toBeUndefined();
    expect(responseBody.paths?.['/v2/authentication']).toBeDefined();
    expect(responseBody.tags?.find(tag => tag.name === 'Business Configurations')?.description).toBe(
      'Manage business-wide configuration resources such as warehouses, labels, payment methods, shipping methods, and number ranges.',
    );
    expect(availabilitiesOperation?.tags).toEqual(['Item Configurations']);
    expect(availabilitiesOperation?.summary).toBe('List Availabilities');
    expect(availabilitiesOperation?.description).toBe('Retrieve all item availabilities.');
    expect(availabilitiesOperation?.responses?.['200']?.description).toBe('The available item availabilities.');
    expect(availabilitiesOperation?.responses?.['401']).toBeUndefined();
    expect(availabilitiesOperation?.responses?.['402']).toBeUndefined();
    expect(availabilitiesOperation?.responses?.['404']).toBeUndefined();
    expect(authenticationOperation?.tags).toBeUndefined();
    expect(itemsOperation?.parameters?.some(parameter => parameter.name === 'x-appid')).toBe(false);
    expect(itemsOperation?.parameters?.some(parameter => parameter.name === 'x-appversion')).toBe(false);
    expect(itemsOperation?.parameters?.some(parameter => parameter.name === 'x-runas')).toBe(false);
    expect(itemsOperation?.parameters?.some(parameter => parameter.name === 'X-SessionId')).toBe(false);
    expect(itemsOperation?.parameters?.find(parameter => parameter.name === 'X-Session-Token')).toMatchObject({
      description: 'The session token you obtained from the App Bridge.',
      in: 'header',
      name: 'X-Session-Token',
    });
    expect(workersOperation?.tags).toEqual(['Synchronizations']);
    expect(workersOperation?.summary).toBe('List Synchronizations');
    expect(workersOperation?.description).toBe('Retrieve the available synchronization configurations.');
    expect(workersOperation?.responses?.['404']).toBeUndefined();
    expect(infoOperation?.tags).toEqual(['API Information']);
    expect(infoOperation?.summary).toBe('Get API Status');
    expect(infoOperation?.responses?.['404']).toBeUndefined();
  });

  it('returns the local GraphQL schema via the transformed schema route', async () => {
    const { createApp } = await import('./index.js');
    const sourceSchema = await readFile(new URL('./assets/schema.graphql', import.meta.url), 'utf8');

    const response = await request(createApp()).get('/graphql/schema.graphql');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toBe(sourceSchema.charCodeAt(0) === 0xfeff ? sourceSchema.slice(1) : sourceSchema);
  });
});
