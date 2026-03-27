import { createAppBridge } from '@jtl-software/cloud-apps-core';
import { useDummyAppBridge } from '../common/constants';
import { isRunningOnJtlCloudDomain } from '../common/runtimeHost';
import { createAppBridgeClient, createDummyAppBridgeClient, type AppBridgeClient } from './appBridgeClient';

export async function createRuntimeAppBridgeClient(hostname = window.location.hostname): Promise<AppBridgeClient> {
  if (useDummyAppBridge && !isRunningOnJtlCloudDomain(hostname)) {
    return createDummyAppBridgeClient();
  }

  const appBridge = await createAppBridge();
  return createAppBridgeClient(appBridge);
}
