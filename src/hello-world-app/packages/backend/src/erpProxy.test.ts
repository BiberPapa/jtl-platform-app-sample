import { describe, expect, it } from 'vitest';
import { buildErpProxyRequest } from './erpProxy.js';

describe('buildErpProxyRequest', () => {
  it('keeps route parameters for non-body methods', () => {
    expect(
      buildErpProxyRequest({
        method: 'GET',
        tenantId: 'tenant-from-route',
        endpoint: 'customers',
        body: undefined,
      }),
    ).toEqual({
      tenantId: 'tenant-from-route',
      endpoint: 'customers',
      body: undefined,
    });
  });

  it('allows request body overrides and strips transport-only fields', () => {
    expect(
      buildErpProxyRequest({
        method: 'POST',
        tenantId: 'tenant-from-route',
        endpoint: 'customers',
        body: {
          _tenantId: 'tenant-from-body',
          _endpoint: 'orders',
          id: 42,
        },
      }),
    ).toEqual({
      tenantId: 'tenant-from-body',
      endpoint: 'orders',
      body: {
        id: 42,
      },
    });
  });
});
