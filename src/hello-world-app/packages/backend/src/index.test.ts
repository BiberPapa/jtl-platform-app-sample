import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type OpenApiResponseBody = {
  security: Array<Record<string, string[]>>;
  paths: Record<string, { get: { parameters: unknown[] } }>;
  components: {
    securitySchemes: Record<string, unknown>;
  };
};

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

describe('backend routes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getAccessTokenMock.mockResolvedValue('access-token');
    getSessionContextFromTokenMock.mockResolvedValue({
      tenantId: 'platform-tenant-id',
      userId: 'user-id',
    });
  });

  it('returns a bad request when the setup route is missing a session token', async () => {
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/connect-tenant');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'The X-Session-Token header must be provided.' });
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

  it('requires a session token header for ERP requests', async () => {
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp/customers');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'The X-Session-Token header must be provided.' });
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

  it('rewrites the forwarded ERP openapi document for backend usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      text: () =>
        Promise.resolve(
          JSON.stringify({
            openapi: '3.0.0',
            paths: {
              '/customers': {
                get: {
                  parameters: [{ name: 'X-Tenant-ID', in: 'header' }],
                },
              },
            },
            components: {
              securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer' },
              },
            },
          }),
        ),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp/openapi.json').set('X-Session-Token', 'session-token');
    const body = response.body as OpenApiResponseBody;
    const customersPath = body.paths['/erp/customers'];

    expect(response.status).toBe(200);
    expect(body.security).toEqual([{ SessionTokenHeader: [] }]);
    expect(customersPath).toBeDefined();
    expect(customersPath!.get.parameters).toEqual([]);
    expect(body.components.securitySchemes).toEqual({
      SessionTokenHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Session-Token',
      },
    });
  });
});
