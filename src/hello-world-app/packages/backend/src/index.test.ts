import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('requires a session token header for ERP requests', async () => {
    const { createApp } = await import('./index.js');

    const response = await request(createApp()).get('/erp-info/customers');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'The X-Session-Token header must be provided.' });
  });

  it('uses the validated tenant and forwards nested ERP endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'ok' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createApp } = await import('./index.js');

    const response = await request(createApp()).post('/erp-info/customers/addresses').set('X-Session-Token', 'session-token').send({ id: 7 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ result: 'ok' });
    expect(getSessionContextFromTokenMock).toHaveBeenCalledWith('session-token');
    expect(fetchMock).toHaveBeenCalledWith('https://api.jtl-cloud.com/erp/customers/addresses', {
      method: 'POST',
      headers: {
        'X-Tenant-ID': 'platform-tenant-id',
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 7 }),
    });
  });
});
