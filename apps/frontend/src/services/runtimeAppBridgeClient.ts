import { createAppBridge } from '@jtl-software/cloud-apps-core';
import { isRunningOnJtlCloudDomain } from '../common/runtimeHost';
import { createAppBridgeClient, createDummyAppBridgeClient, type AppBridgeClient } from './appBridgeClient';

export async function createRuntimeAppBridgeClient(hostname = window.location.hostname): Promise<AppBridgeClient> {
  if (!isRunningOnJtlCloudDomain(hostname)) {
    return createDummyAppBridgeClient();
  }

  const appBridge = await createAppBridge();
  return createAppBridgeClient(appBridge);
}
