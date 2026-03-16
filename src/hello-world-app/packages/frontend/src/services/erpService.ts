import { apiUrl } from '../common/constants';
import type { AppBridgeClient } from './appBridgeClient';

export async function requestCustomers(appBridgeClient: AppBridgeClient): Promise<unknown> {
  const sessionToken = await appBridgeClient.getSessionToken();

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
