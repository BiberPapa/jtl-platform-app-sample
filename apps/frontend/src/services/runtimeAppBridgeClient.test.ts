import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBridgeClient } from './appBridgeClient';

const { createAppBridgeMock, createAppBridgeClientMock } = vi.hoisted(() => ({
  createAppBridgeMock: vi.fn<() => Promise<AppBridge>>(),
  createAppBridgeClientMock: vi.fn<(appBridge: AppBridge) => AppBridgeClient>(),
}));

vi.mock('@jtl-software/cloud-apps-core', () => ({
  createAppBridge: createAppBridgeMock,
}));

vi.mock('./appBridgeClient', () => ({
  createAppBridgeClient: createAppBridgeClientMock,
}));

describe('createRuntimeAppBridgeClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');
  });

  it('creates and returns a real AppBridge client', async () => {
    const appBridge = {} as AppBridge;
    const appBridgeClient = createAppBridgeClientDouble();
    createAppBridgeMock.mockResolvedValue(appBridge);
    createAppBridgeClientMock.mockReturnValue(appBridgeClient);

    const { createRuntimeAppBridgeClient } = await import('./runtimeAppBridgeClient');

    const result = await createRuntimeAppBridgeClient();

    expect(result).toBe(appBridgeClient);
    expect(createAppBridgeMock).toHaveBeenCalledTimes(1);
    expect(createAppBridgeClientMock).toHaveBeenCalledWith(appBridge);
  });

  it('propagates errors from AppBridge initialization', async () => {
    const error = new Error('AppBridge initialization failed');
    createAppBridgeMock.mockRejectedValue(error);

    const { createRuntimeAppBridgeClient } = await import('./runtimeAppBridgeClient');

    await expect(createRuntimeAppBridgeClient()).rejects.toBe(error);
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
