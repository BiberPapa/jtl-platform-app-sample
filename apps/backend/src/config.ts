export type ApiEnvironment = 'dev' | 'qa' | 'prod';

function normalizeApiEnvironmentInput(apiEnvironment: string | undefined): string {
  return (apiEnvironment?.trim() || 'prod').toLowerCase();
}

export function getNormalizedApiEnvironment(apiEnvironment: string | undefined): ApiEnvironment {
  const normalizedEnvironment = normalizeApiEnvironmentInput(apiEnvironment);

  if (normalizedEnvironment === 'dev') {
    return 'dev';
  }

  if (normalizedEnvironment === 'qa') {
    return 'qa';
  }

  return 'prod';
}

export function getApiEnvironmentSuffix(apiEnvironment: string | undefined): string {
  const normalizedEnvironment = getNormalizedApiEnvironment(apiEnvironment);

  return normalizedEnvironment === 'prod' ? '' : `.${normalizedEnvironment}`;
}

export const environmentSuffix = getApiEnvironmentSuffix(process.env.API_ENVIRONMENT);

export function getApiBaseUrl(apiEnvironmentSuffix = environmentSuffix): string {
  return `https://api${apiEnvironmentSuffix}.jtl-cloud.com`;
}

export function getHubUrl(apiEnvironmentSuffix = environmentSuffix): string {
  return `https://hub${apiEnvironmentSuffix}.jtl-cloud.com`;
}

export function getCloudErpUrl(apiEnvironmentSuffix = environmentSuffix): string {
  return `https://erp${apiEnvironmentSuffix}.jtl-cloud.com`;
}

export function getAuthEndpoint(apiEnvironmentSuffix = environmentSuffix): string {
  if (apiEnvironmentSuffix === '') {
    return 'https://auth.jtl-cloud.com/oauth2/token';
  }

  return `https://auth${apiEnvironmentSuffix}.jtl-cloud.com/oauth2/token`;
}

export function getJwksEndpoint(apiEnvironmentSuffix = environmentSuffix): string {
  return `${getApiBaseUrl(apiEnvironmentSuffix)}/account/.well-known/jwks.json`;
}

export function getErpEndpoint(endpoint: string, apiEnvironmentSuffix = environmentSuffix): string {
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');

  return `${getApiBaseUrl(apiEnvironmentSuffix)}/erp/${normalizedEndpoint}`;
}

export function getGraphQlEndpoint(apiEnvironmentSuffix = environmentSuffix): string {
  return `${getApiBaseUrl(apiEnvironmentSuffix)}/erp/v2/graphql`;
}
