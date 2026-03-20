import type { AppBridge } from '@jtl-software/cloud-apps-core';

export type CustomerChangedEvent = {
  customerId: string;
};

export type AppBridgeClient = {
  getSessionToken: () => Promise<string>;
  setupCompleted: () => Promise<void>;
  getCurrentCustomerId: () => Promise<string>;
  subscribeToCustomerChanged: (handler: (event: CustomerChangedEvent) => void) => () => void;
};

export function createAppBridgeClient(appBridge: AppBridge): AppBridgeClient {
  return {
    async getSessionToken(): Promise<string> {
      const sessionToken = await appBridge.method.call<unknown>('getSessionToken');

      if (typeof sessionToken !== 'string') {
        throw new Error('Expected the bridge to return a session token string.');
      }

      return sessionToken;
    },
    async setupCompleted(): Promise<void> {
      await appBridge.method.call('setupCompleted');
    },
    async getCurrentCustomerId(): Promise<string> {
      const customerId = await appBridge.method.call<unknown>('getCurrentCustomerId');

      if (typeof customerId !== 'string') {
        throw new Error('Expected the bridge to return a customer id string.');
      }

      return customerId;
    },
    subscribeToCustomerChanged(handler: (event: CustomerChangedEvent) => void): () => void {
      return appBridge.event.subscribe('CustomerChanged', (data: unknown) => {
        if (!isCustomerChangedEvent(data)) {
          throw new Error('The bridge emitted an unexpected CustomerChanged payload.');
        }

        handler(data);
        return Promise.resolve();
      });
    },
  };
}

function isCustomerChangedEvent(value: unknown): value is CustomerChangedEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.customerId === 'string';
}
