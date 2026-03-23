import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBridgeClient } from './appBridgeClient';
import { createRuntimeAppBridgeClient } from './runtimeAppBridgeClient';

const { createAppBridgeMock, createAppBridgeClientMock, createDummyAppBridgeClientMock } = vi.hoisted(() => ({
  createAppBridgeMock: vi.fn<() => Promise<AppBridge>>(),
  createAppBridgeClientMock: vi.fn<(appBridge: AppBridge) => AppBridgeClient>(),
  createDummyAppBridgeClientMock: vi.fn<() => AppBridgeClient>(),
}));

vi.mock('@jtl-software/cloud-apps-core', () => ({
  createAppBridge: createAppBridgeMock,
}));

vi.mock('./appBridgeClient', () => ({
  createAppBridgeClient: createAppBridgeClientMock,
  createDummyAppBridgeClient: createDummyAppBridgeClientMock,
}));

describe('createRuntimeAppBridgeClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates a dummy bridge client outside the jtl cloud domain', async () => {
    const dummyClient = createAppBridgeClientDouble();
    createDummyAppBridgeClientMock.mockReturnValue(dummyClient);

    await expect(createRuntimeAppBridgeClient('localhost')).resolves.toBe(dummyClient);
    expect(createDummyAppBridgeClientMock).toHaveBeenCalledTimes(1);
    expect(createAppBridgeMock).not.toHaveBeenCalled();
    expect(createAppBridgeClientMock).not.toHaveBeenCalled();
  });

  it('creates a real bridge client on jtl cloud domains', async () => {
    const appBridge = {} as AppBridge;
    const appBridgeClient = createAppBridgeClientDouble();
    createAppBridgeMock.mockResolvedValue(appBridge);
    createAppBridgeClientMock.mockReturnValue(appBridgeClient);

    await expect(createRuntimeAppBridgeClient('hub.qa.jtl-cloud.com')).resolves.toBe(appBridgeClient);
    expect(createAppBridgeMock).toHaveBeenCalledTimes(1);
    expect(createAppBridgeClientMock).toHaveBeenCalledWith(appBridge);
    expect(createDummyAppBridgeClientMock).not.toHaveBeenCalled();
  });
});

function createAppBridgeClientDouble(): AppBridgeClient {
  return {
    getSessionToken: vi.fn(() => Promise.resolve('')),
    setupCompleted: vi.fn(() => Promise.resolve()),
    getCurrentCustomerId: vi.fn(() => Promise.resolve('')),
    subscribeToCustomerChanged: vi.fn(() => vi.fn()),
  };
}
