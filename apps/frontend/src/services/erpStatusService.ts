import type { AppBridgeClient } from './appBridgeClient';
import { requestCloudApi } from './cloudApiClient';
import type { ErpInstanceStatus } from '../types/jtlCloudApi';

/**
 * Fetch ERP instance status
 * @see https://api.jtl-cloud.com/erp/instance/status
 */
export async function fetchErpInstanceStatus(appBridgeClient: AppBridgeClient): Promise<ErpInstanceStatus> {
  const response = await requestCloudApi<ErpInstanceStatus>({
    url: 'https://api.jtl-cloud.com/erp/instance/status',
    appBridgeClient,
    method: 'GET',
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Failed to fetch ERP instance status');
  }

  return response.data;
}

/**
 * Check if ERP instance is connected
 */
export async function isErpInstanceConnected(appBridgeClient: AppBridgeClient): Promise<boolean> {
  try {
    const status = await fetchErpInstanceStatus(appBridgeClient);
    return status.metadata.connected;
  } catch {
    return false;
  }
}

/**
 * Get time since ERP instance was last seen
 */
export async function getErpLastSeenMinutesAgo(appBridgeClient: AppBridgeClient): Promise<number> {
  const status = await fetchErpInstanceStatus(appBridgeClient);
  const lastSeen = new Date(status.metadata.lastSeen);
  const now = new Date();
  return Math.floor((now.getTime() - lastSeen.getTime()) / 1000 / 60);
}
