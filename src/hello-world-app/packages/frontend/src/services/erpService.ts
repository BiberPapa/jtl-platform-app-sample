import type { AppBridge } from '@jtl-software/cloud-apps-core';

export async function requestCurrentTime(appBridge: AppBridge): Promise<string> {
  appBridge.method.expose('getCurrentTime', () => new Date().toISOString());

  return await appBridge.method.call<string>('getCurrentTime');
}
