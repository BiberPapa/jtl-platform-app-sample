import { createAppBridge } from '@jtl-software/cloud-apps-core';
import { createAppBridgeClient, type AppBridgeClient } from './appBridgeClient';

/**
 * Create an AppBridge client for the current runtime environment.
 * 
 * This always requires AppBridge to be available from the JTL Hub.
 * If the app is running outside the hub, AppBridge initialization will fail.
 * 
 * Only call this for routes that require bridge integration (setup, erp-menu-item, erp-pane).
 */
export async function createRuntimeAppBridgeClient(): Promise<AppBridgeClient> {
  const appBridge = await createAppBridge();
  return createAppBridgeClient(appBridge);
}
