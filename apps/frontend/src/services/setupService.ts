import type { AppBridgeClient } from './appBridgeClient';
import { getBackendErrorMessage, requestBackend } from './apiClient';

export type ConnectTenantResult = {
  message: string;
};

export async function connectTenant(appBridgeClient: AppBridgeClient): Promise<ConnectTenantResult> {
  const response = await requestBackend({
    path: '/connect-tenant',
    method: 'POST',
    appBridgeClient,
  });

  if (!response.ok) {
    throw new Error(getBackendErrorMessage(response, 'The backend rejected the tenant connection request.'));
  }

  if (response.json && typeof response.json === 'object' && typeof (response.json as { message?: unknown }).message === 'string') {
    return { message: (response.json as { message: string }).message };
  }

  return { message: 'Tenant connected successfully.' };
}
