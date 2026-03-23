import { describe, expect, it, vi } from 'vitest';
import type { AppBridgeClient } from './appBridgeClient';
import { extractTenantIdFromSessionToken, getGlobalTenantIdFromSessionToken } from './sessionTokenTenant';

describe('extractTenantIdFromSessionToken', () => {
  it('returns the tenantId from a valid JWT payload', () => {
    expect(extractTenantIdFromSessionToken(createSessionToken({ tenantId: 'global-tenant-id' }))).toBe('global-tenant-id');
  });

  it('returns null for an invalid JWT structure', () => {
    expect(extractTenantIdFromSessionToken('invalid-token')).toBeNull();
  });

  it('returns null for invalid payload encoding or JSON', () => {
    expect(extractTenantIdFromSessionToken('header.invalid-payload.signature')).toBeNull();
  });

  it('returns null when the payload does not contain a tenantId', () => {
    expect(extractTenantIdFromSessionToken(createSessionToken({ userId: 'user-1' }))).toBeNull();
  });
});

describe('getGlobalTenantIdFromSessionToken', () => {
  it('returns null when the bridge returns an empty token', async () => {
    const appBridgeClient = createAppBridgeClientMock('');

    await expect(getGlobalTenantIdFromSessionToken(appBridgeClient)).resolves.toBeNull();
  });

  it('returns null when reading the session token fails', async () => {
    const appBridgeClient = createAppBridgeClientMock(new Error('Bridge unavailable'));

    await expect(getGlobalTenantIdFromSessionToken(appBridgeClient)).resolves.toBeNull();
  });
});

function createSessionToken(payload: Record<string, unknown>): string {
  const encodedHeader = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));

  return `${encodedHeader}.${encodedPayload}.signature`;
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createAppBridgeClientMock(result: string | Error): AppBridgeClient {
  return {
    getSessionToken: vi.fn(() => {
      if (result instanceof Error) {
        return Promise.reject(result);
      }

      return Promise.resolve(result);
    }),
    setupCompleted: vi.fn<() => Promise<void>>(),
    getCurrentCustomerId: vi.fn<() => Promise<string>>(),
    subscribeToCustomerChanged: vi.fn(() => vi.fn()),
  };
}
