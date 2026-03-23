import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { describe, expect, it, vi } from 'vitest';
import { createAppBridgeClient, createDummyAppBridgeClient } from './appBridgeClient';

type BridgeMock = {
  appBridge: AppBridge;
  methodCall: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

function createAppBridgeMock(): BridgeMock {
  const methodCall = vi.fn();
  const subscribe = vi.fn(() => vi.fn());

  return {
    appBridge: {
      event: {
        subscribe,
      },
      method: {
        call: methodCall,
        expose: vi.fn(),
      },
    } as unknown as AppBridge,
    methodCall,
    subscribe,
  };
}

describe('createAppBridgeClient', () => {
  it('validates getSessionToken responses as strings', async () => {
    const { appBridge, methodCall } = createAppBridgeMock();
    methodCall.mockResolvedValueOnce('session-token');

    const client = createAppBridgeClient(appBridge);

    await expect(client.getSessionToken()).resolves.toBe('session-token');
  });

  it('validates getCurrentCustomerId responses as strings', async () => {
    const { appBridge, methodCall } = createAppBridgeMock();
    methodCall.mockResolvedValueOnce('customer-42');

    const client = createAppBridgeClient(appBridge);

    await expect(client.getCurrentCustomerId()).resolves.toBe('customer-42');
  });

  it('rejects invalid CustomerChanged payloads', async () => {
    const { appBridge, subscribe } = createAppBridgeMock();
    const handler = vi.fn();
    const client = createAppBridgeClient(appBridge);

    client.subscribeToCustomerChanged(handler);

    const subscriptionHandler = subscribe.mock.calls[0]![1] as (value: unknown) => Promise<void>;

    await expect(async () => {
      await subscriptionHandler({ invalid: true });
    }).rejects.toThrow('The bridge emitted an unexpected CustomerChanged payload.');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('createDummyAppBridgeClient', () => {
  it('returns predictable default values and logs the nohub mode', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const client = createDummyAppBridgeClient();

    await expect(client.getSessionToken()).resolves.toBe('');
    await expect(client.getCurrentCustomerId()).resolves.toBe('');
    await expect(client.setupCompleted()).resolves.toBeUndefined();

    const unsubscribe = client.subscribeToCustomerChanged(vi.fn());
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();

    expect(consoleInfoSpy).toHaveBeenCalledWith('[NOHUB][DummyAppBridge] getSessionToken was called while the app is running outside the hub.');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[NOHUB][DummyAppBridge] getCurrentCustomerId was called while the app is running outside the hub.');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[NOHUB][DummyAppBridge] setupCompleted was called while the app is running outside the hub.');
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[NOHUB][DummyAppBridge] subscribeToCustomerChanged was called while the app is running outside the hub.',
    );
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[NOHUB][DummyAppBridge] unsubscribeCustomerChanged was called while the app is running outside the hub.',
    );
  });
});
