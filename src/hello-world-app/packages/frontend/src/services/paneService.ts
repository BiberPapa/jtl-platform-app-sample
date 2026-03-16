import type { AppBridgeClient } from './appBridgeClient';

export async function getCurrentCustomerId(appBridgeClient: AppBridgeClient): Promise<string> {
  return await appBridgeClient.getCurrentCustomerId();
}
