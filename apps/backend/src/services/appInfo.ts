import { getApiBaseUrl, getAuthEndpoint, getCloudErpUrl, getHubUrl, getNormalizedApiEnvironment } from '../config.js';

export type AppInfo = {
  environment: 'dev' | 'qa' | 'prod';
  hubUrl: string;
  cloudErpUrl: string;
  apiBaseUrl: string;
  authUrl: string;
};

export function getAppInfo(): AppInfo {
  return {
    environment: getNormalizedApiEnvironment(process.env.API_ENVIRONMENT),
    hubUrl: getHubUrl(),
    cloudErpUrl: getCloudErpUrl(),
    apiBaseUrl: getApiBaseUrl(),
    authUrl: getAuthEndpoint(),
  };
}
