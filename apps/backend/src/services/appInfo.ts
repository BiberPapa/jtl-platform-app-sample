import { getApiBaseUrl, getAuthEndpoint, getCloudErpUrl, getHubUrl, getNormalizedApiEnvironment } from '../config.js';

export type AppInfo = {
  environment: 'dev' | 'qa' | 'prod';
  nohubTenantId: string | null;
  isNohubConfigured: boolean;
  hubUrl: string;
  cloudErpUrl: string;
  apiBaseUrl: string;
  authUrl: string;
};

export function getAppInfo(): AppInfo {
  const nohubTenantId = getConfiguredNohubTenantId();

  return {
    environment: getNormalizedApiEnvironment(process.env.API_ENVIRONMENT),
    nohubTenantId,
    isNohubConfigured: nohubTenantId !== null,
    hubUrl: getHubUrl(),
    cloudErpUrl: getCloudErpUrl(),
    apiBaseUrl: getApiBaseUrl(),
    authUrl: getAuthEndpoint(),
  };
}

function getConfiguredNohubTenantId(): string | null {
  const candidate = process.env.NOHUB_TENANT_ID;

  if (typeof candidate !== 'string') {
    return null;
  }

  const trimmedCandidate = candidate.trim();

  return trimmedCandidate.length > 0 ? trimmedCandidate : null;
}
