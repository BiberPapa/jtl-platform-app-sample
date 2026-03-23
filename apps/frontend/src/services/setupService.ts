import type { AppBridgeClient } from './appBridgeClient';
import { createAppErrorFromBackendResponse, toAppError } from './appError';
import { requestBackend } from './apiClient';

export type ConnectTenantResult = {
  message: string;
};

export async function connectTenant(appBridgeClient: AppBridgeClient): Promise<ConnectTenantResult> {
  try {
    const response = await requestBackend({
      path: '/connect-tenant',
      method: 'POST',
      appBridgeClient,
    });

    if (!response.ok) {
      throw createAppErrorFromBackendResponse(response, {
        source: 'setup',
        requestPath: '/connect-tenant',
        fallbackMessage: 'The backend rejected the tenant connection request.',
      });
    }

    if (response.json && typeof response.json === 'object' && typeof (response.json as { message?: unknown }).message === 'string') {
      return { message: (response.json as { message: string }).message };
    }

    return { message: 'Tenant connected successfully.' };
  } catch (error) {
    throw toAppError(error, {
      source: 'setup',
      requestPath: '/connect-tenant',
      fallbackMessage: 'The backend rejected the tenant connection request.',
    });
  }
}
