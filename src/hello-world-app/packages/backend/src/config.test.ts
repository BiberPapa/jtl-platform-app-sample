import { describe, expect, it } from 'vitest';
import { getApiEnvironmentSuffix, getAuthEndpoint, getErpEndpoint, getJwksEndpoint } from './config.js';

describe('backend config helpers', () => {
  it('maps the production environment to an empty API suffix', () => {
    expect(getApiEnvironmentSuffix('prod')).toBe('');
    expect(getApiEnvironmentSuffix(undefined)).toBe('');
  });

  it('maps non-production environments to a dotted suffix', () => {
    expect(getApiEnvironmentSuffix('dev')).toBe('.dev');
    expect(getApiEnvironmentSuffix('qa')).toBe('.qa');
  });

  it('builds the correct auth and jwks endpoints', () => {
    expect(getAuthEndpoint('')).toBe('https://auth.jtl-cloud.com/oauth2/token');
    expect(getAuthEndpoint('.beta')).toBe('https://auth.jtl-cloud.com/oauth2/token');
    expect(getAuthEndpoint('.qa')).toBe('https://auth.qa.jtl-cloud.com/oauth2/token');
    expect(getJwksEndpoint('.dev')).toBe('https://api.dev.jtl-cloud.com/account/.well-known/jwks.json');
  });

  it('builds ERP endpoints from config', () => {
    expect(getErpEndpoint('customers', '.dev')).toBe('https://api.dev.jtl-cloud.com/erp/customers');
    expect(getErpEndpoint('/orders', '.qa')).toBe('https://api.qa.jtl-cloud.com/erp/orders');
  });
});
