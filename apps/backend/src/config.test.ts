import { describe, expect, it } from 'vitest';
import {
  getApiEnvironmentSuffix,
  getAuthEndpoint,
  getCloudErpUrl,
  getErpEndpoint,
  getGraphQlEndpoint,
  getHubUrl,
  getJwksEndpoint,
  getNormalizedApiEnvironment,
} from './config.js';

describe('backend config helpers', () => {
  it('maps the production environment to an empty API suffix', () => {
    expect(getApiEnvironmentSuffix('prod')).toBe('');
    expect(getApiEnvironmentSuffix(undefined)).toBe('');
  });

  it('maps non-production environments to a dotted suffix', () => {
    expect(getApiEnvironmentSuffix('dev')).toBe('.dev');
    expect(getApiEnvironmentSuffix('qa')).toBe('.qa');
    expect(getApiEnvironmentSuffix(' QA ')).toBe('.qa');
  });

  it('normalizes API environments for display use cases', () => {
    expect(getNormalizedApiEnvironment(undefined)).toBe('prod');
    expect(getNormalizedApiEnvironment('')).toBe('prod');
    expect(getNormalizedApiEnvironment('prod')).toBe('prod');
    expect(getNormalizedApiEnvironment('production')).toBe('prod');
    expect(getNormalizedApiEnvironment('dev')).toBe('dev');
    expect(getNormalizedApiEnvironment('qa')).toBe('qa');
    expect(getNormalizedApiEnvironment('beta')).toBe('prod');
  });

  it('builds the correct auth and jwks endpoints', () => {
    expect(getAuthEndpoint('')).toBe('https://auth.jtl-cloud.com/oauth2/token');
    expect(getAuthEndpoint('.qa')).toBe('https://auth.qa.jtl-cloud.com/oauth2/token');
    expect(getJwksEndpoint('.dev')).toBe('https://api.dev.jtl-cloud.com/account/.well-known/jwks.json');
  });

  it('builds the correct hub and cloud erp URLs', () => {
    expect(getHubUrl('')).toBe('https://hub.jtl-cloud.com');
    expect(getHubUrl('.qa')).toBe('https://hub.qa.jtl-cloud.com');
    expect(getCloudErpUrl('')).toBe('https://erp.jtl-cloud.com');
    expect(getCloudErpUrl('.dev')).toBe('https://erp.dev.jtl-cloud.com');
  });

  it('builds ERP endpoints from config', () => {
    expect(getErpEndpoint('customers', '.dev')).toBe('https://api.dev.jtl-cloud.com/erp/customers');
    expect(getErpEndpoint('/orders', '.qa')).toBe('https://api.qa.jtl-cloud.com/erp/orders');
  });

  it('builds the GraphQL endpoint from config', () => {
    expect(getGraphQlEndpoint('')).toBe('https://api.jtl-cloud.com/erp/v2/graphql');
    expect(getGraphQlEndpoint('.qa')).toBe('https://api.qa.jtl-cloud.com/erp/v2/graphql');
  });
});
