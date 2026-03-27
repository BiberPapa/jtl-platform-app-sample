import type { AppBridgeClient } from './appBridgeClient';
import { requestCloudApi } from './cloudApiClient';
import type { Session } from '../types/jtlCloudApi';

/**
 * Fetch current session information
 * @see https://auth.jtl-cloud.com/sessions/whoami
 */
export async function fetchCurrentSession(appBridgeClient: AppBridgeClient): Promise<Session> {
  const response = await requestCloudApi<Session>({
    url: 'https://auth.jtl-cloud.com/sessions/whoami',
    appBridgeClient,
    method: 'GET',
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Failed to fetch session information');
  }

  return response.data;
}

/**
 * Get current user information
 */
export async function getCurrentUser(appBridgeClient: AppBridgeClient) {
  const session = await fetchCurrentSession(appBridgeClient);
  return session.identity;
}

/**
 * Get current user's email
 */
export async function getCurrentUserEmail(appBridgeClient: AppBridgeClient): Promise<string> {
  const user = await getCurrentUser(appBridgeClient);
  return user.traits.email;
}

/**
 * Get current user's full name
 */
export async function getCurrentUserName(appBridgeClient: AppBridgeClient): Promise<string> {
  const user = await getCurrentUser(appBridgeClient);
  return `${user.traits.name.first} ${user.traits.name.last}`;
}

/**
 * Check if current session is active and not expired
 */
export async function isSessionActive(appBridgeClient: AppBridgeClient): Promise<boolean> {
  try {
    const session = await fetchCurrentSession(appBridgeClient);
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    return session.active && expiresAt > now;
  } catch {
    return false;
  }
}

/**
 * Get authentication assurance level (AAL)
 */
export async function getAuthenticationAssuranceLevel(appBridgeClient: AppBridgeClient): Promise<string> {
  const session = await fetchCurrentSession(appBridgeClient);
  return session.authenticator_assurance_level;
}

/**
 * Check if 2FA is enabled for current user
 */
export async function is2faEnabled(appBridgeClient: AppBridgeClient): Promise<boolean> {
  const user = await getCurrentUser(appBridgeClient);
  const twoFaData = user.metadata_public['2fa_enforcement'];
  return typeof twoFaData === 'object' && twoFaData !== null && (twoFaData as Record<string, unknown>)['is_2fa_enabled'] === true;
}
