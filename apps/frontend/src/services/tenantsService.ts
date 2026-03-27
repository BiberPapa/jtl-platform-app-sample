import type { AppBridgeClient } from './appBridgeClient';
import { requestCloudApi } from './cloudApiClient';
import type { Tenant } from '../types/jtlCloudApi';

/**
 * Fetch list of tenants accessible by the current user
 * @see https://api.jtl-cloud.com/account/tenants
 */
export async function fetchTenants(appBridgeClient: AppBridgeClient): Promise<Tenant[]> {
  const response = await requestCloudApi<Tenant[]>({
    url: 'https://api.jtl-cloud.com/account/tenants',
    appBridgeClient,
    method: 'GET',
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Failed to fetch tenants');
  }

  return response.data;
}

/**
 * Fetch a single tenant by ID
 */
export async function fetchTenant(tenantId: string, appBridgeClient: AppBridgeClient): Promise<Tenant> {
  const tenants = await fetchTenants(appBridgeClient);
  const tenant = tenants.find(t => t.id === tenantId);

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  return tenant;
}

/**
 * Fetch the default tenant (first in list)
 */
export async function fetchDefaultTenant(appBridgeClient: AppBridgeClient): Promise<Tenant> {
  const tenants = await fetchTenants(appBridgeClient);

  if (tenants.length === 0) {
    throw new Error('No tenants available');
  }

  return tenants[0]!;
}
