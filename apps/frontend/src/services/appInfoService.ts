import type { AppBridgeClient } from './appBridgeClient';
import { createAppErrorFromBackendResponse, createUnexpectedAppError, toAppError } from './appError';
import { requestBackend } from './apiClient';

export type AppInfoResponse = {
  environment: 'dev' | 'qa' | 'prod';
  nohubTenantId: string | null;
  isNohubConfigured: boolean;
  hubUrl: string;
  cloudErpUrl: string;
  apiBaseUrl: string;
  authUrl: string;
};

export async function requestAppInfo(appBridgeClient: AppBridgeClient): Promise<AppInfoResponse> {
  try {
    const response = await requestBackend({
      path: '/app-info',
      appBridgeClient,
    });

    if (!response.ok) {
      throw createAppErrorFromBackendResponse(response, {
        source: 'app-info',
        requestPath: '/app-info',
        fallbackMessage: 'The backend app info could not be loaded.',
      });
    }

    if (!isAppInfoResponse(response.json)) {
      throw createUnexpectedAppError({
        source: 'app-info',
        requestPath: '/app-info',
        fallbackMessage: 'The backend app info returned an unexpected payload.',
        status: response.status,
        raw: response.json,
      });
    }

    return response.json;
  } catch (error) {
    throw toAppError(error, {
      source: 'app-info',
      requestPath: '/app-info',
      fallbackMessage: 'The backend app info could not be loaded.',
    });
  }
}

function isAppInfoResponse(value: unknown): value is AppInfoResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate['environment'] === 'dev' || candidate['environment'] === 'qa' || candidate['environment'] === 'prod') &&
    (typeof candidate['nohubTenantId'] === 'string' || candidate['nohubTenantId'] === null) &&
    typeof candidate['isNohubConfigured'] === 'boolean' &&
    typeof candidate['hubUrl'] === 'string' &&
    typeof candidate['cloudErpUrl'] === 'string' &&
    typeof candidate['apiBaseUrl'] === 'string' &&
    typeof candidate['authUrl'] === 'string'
  );
}
