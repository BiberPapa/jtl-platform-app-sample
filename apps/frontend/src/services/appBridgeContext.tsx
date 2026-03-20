import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { createAppBridgeClient, type AppBridgeClient } from './appBridgeClient';

type AppBridgeContextValue = {
  appBridge: AppBridge;
  appBridgeClient: AppBridgeClient;
};

const AppBridgeContext = createContext<AppBridgeContextValue | null>(null);

type AppBridgeProviderProps = {
  appBridge: AppBridge;
  children: ReactNode;
};

export function AppBridgeProvider({ appBridge, children }: AppBridgeProviderProps) {
  const appBridgeClient = useMemo(() => createAppBridgeClient(appBridge), [appBridge]);
  const contextValue = useMemo(
    () => ({
      appBridge,
      appBridgeClient,
    }),
    [appBridge, appBridgeClient],
  );

  return <AppBridgeContext.Provider value={contextValue}>{children}</AppBridgeContext.Provider>;
}

export function useAppBridgeClient(): AppBridgeClient {
  return getAppBridgeContextValue().appBridgeClient;
}

function getAppBridgeContextValue(): AppBridgeContextValue {
  const contextValue = useContext(AppBridgeContext);

  if (!contextValue) {
    throw new Error('Expected the app bridge context to be available.');
  }

  return contextValue;
}
