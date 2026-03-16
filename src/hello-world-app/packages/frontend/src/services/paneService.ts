import type { AppBridge } from '@jtl-software/cloud-apps-core';

export type CustomerChangedEvent = {
  customerId: string;
};

export function isCustomerChangedEvent(value: unknown): value is CustomerChangedEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.customerId === 'string';
}

export async function getCurrentCustomerId(appBridge: AppBridge): Promise<string> {
  const customerId = await appBridge.method.call<unknown>('getCurrentCustomerId');

  if (typeof customerId !== 'string') {
    throw new Error('Expected the bridge to return a customer id string.');
  }

  return customerId;
}
