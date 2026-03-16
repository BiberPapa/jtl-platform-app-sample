export function getApiEnvironmentSuffix(apiEnvironment: string | undefined): string {
  const normalizedEnvironment = apiEnvironment?.trim() || 'prod';

  return normalizedEnvironment === 'prod' ? '' : `.${normalizedEnvironment}`;
}

export const environmentSuffix = getApiEnvironmentSuffix(process.env.API_ENVIRONMENT);

export function getApiBaseUrl(apiEnvironmentSuffix = environmentSuffix): string {
  return `https://api${apiEnvironmentSuffix}.jtl-cloud.com`;
}

export function getAuthEndpoint(apiEnvironmentSuffix = environmentSuffix): string {
  if (apiEnvironmentSuffix === '' || apiEnvironmentSuffix === '.beta') {
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
