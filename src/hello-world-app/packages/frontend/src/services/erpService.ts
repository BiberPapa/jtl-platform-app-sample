import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { apiUrl } from '../common/constants';

export async function requestCustomers(appBridge: AppBridge): Promise<unknown> {
  const sessionToken = await appBridge.method.call<unknown>('getSessionToken');

  if (typeof sessionToken !== 'string') {
    throw new Error('Expected the bridge to return a session token string.');
  }

  const response = await fetch(`${apiUrl}/erp/customers`, {
    headers: {
      'X-Session-Token': sessionToken,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'The customer data could not be loaded.');
  }

  return (await response.json()) as unknown;
}
