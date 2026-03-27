import type { AppBridgeClient } from './appBridgeClient';
import { requestCloudApi } from './cloudApiClient';
import type { UserSettings } from '../types/jtlCloudApi';

/**
 * Fetch user settings
 * @see https://api.jtl-cloud.com/account/user-settings
 */
export async function fetchUserSettings(appBridgeClient: AppBridgeClient): Promise<UserSettings> {
  const response = await requestCloudApi<UserSettings>({
    url: 'https://api.jtl-cloud.com/account/user-settings',
    appBridgeClient,
    method: 'GET',
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Failed to fetch user settings');
  }

  return response.data;
}

/**
 * Update user settings
 */
export async function updateUserSettings(appBridgeClient: AppBridgeClient, settings: Partial<UserSettings>): Promise<UserSettings> {
  const response = await requestCloudApi<UserSettings>({
    url: 'https://api.jtl-cloud.com/account/user-settings',
    appBridgeClient,
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Failed to update user settings');
  }

  return response.data;
}

/**
 * Get user's application language preference
 */
export async function getUserLanguage(appBridgeClient: AppBridgeClient): Promise<string> {
  const settings = await fetchUserSettings(appBridgeClient);
  return settings.applicationLanguage;
}

/**
 * Get user's theme preference
 */
export async function getUserTheme(appBridgeClient: AppBridgeClient): Promise<string> {
  const settings = await fetchUserSettings(appBridgeClient);
  return settings.theme;
}

/**
 * Get user's timezone
 */
export async function getUserTimezone(appBridgeClient: AppBridgeClient): Promise<string> {
  const settings = await fetchUserSettings(appBridgeClient);
  return settings.userTimezone;
}
