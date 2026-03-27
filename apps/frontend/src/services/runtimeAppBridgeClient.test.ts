import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBridgeClient } from './appBridgeClient';

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
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');
    vi.stubEnv('VITE_USE_DUMMY_APP_BRIDGE', 'false');
  });

  it('creates a dummy bridge client outside the jtl cloud domain when the fallback flag is enabled', async () => {
    const dummyClient = createAppBridgeClientDouble();
    createDummyAppBridgeClientMock.mockReturnValue(dummyClient);
    vi.stubEnv('VITE_USE_DUMMY_APP_BRIDGE', 'true');

    const { createRuntimeAppBridgeClient } = await import('./runtimeAppBridgeClient');

    await expect(createRuntimeAppBridgeClient('localhost')).resolves.toBe(dummyClient);
    expect(createDummyAppBridgeClientMock).toHaveBeenCalledTimes(1);
    expect(createAppBridgeMock).not.toHaveBeenCalled();
    expect(createAppBridgeClientMock).not.toHaveBeenCalled();
  });

  it('creates a real bridge client outside the jtl cloud domain when the fallback flag is disabled', async () => {
    const appBridge = {} as AppBridge;
    const appBridgeClient = createAppBridgeClientDouble();
    createAppBridgeMock.mockResolvedValue(appBridge);
    createAppBridgeClientMock.mockReturnValue(appBridgeClient);

    const { createRuntimeAppBridgeClient } = await import('./runtimeAppBridgeClient');

    await expect(createRuntimeAppBridgeClient('localhost')).resolves.toBe(appBridgeClient);
    expect(createDummyAppBridgeClientMock).not.toHaveBeenCalled();
    expect(createAppBridgeMock).toHaveBeenCalledTimes(1);
    expect(createAppBridgeClientMock).toHaveBeenCalledWith(appBridge);
  });

  it('creates a real bridge client on jtl cloud domains even when the fallback flag is enabled', async () => {
    const appBridge = {} as AppBridge;
    const appBridgeClient = createAppBridgeClientDouble();
    createAppBridgeMock.mockResolvedValue(appBridge);
    createAppBridgeClientMock.mockReturnValue(appBridgeClient);
    vi.stubEnv('VITE_USE_DUMMY_APP_BRIDGE', 'true');

    const { createRuntimeAppBridgeClient } = await import('./runtimeAppBridgeClient');

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
