import { createContext, type ReactNode, useContext } from 'react';
import type { AppBridgeClient } from './appBridgeClient';

type AppBridgeContextValue = {
  appBridgeClient: AppBridgeClient;
};

const AppBridgeContext = createContext<AppBridgeContextValue | null>(null);

type AppBridgeProviderProps = {
  appBridgeClient: AppBridgeClient;
  children: ReactNode;
};

export function AppBridgeProvider({ appBridgeClient, children }: AppBridgeProviderProps) {
  return <AppBridgeContext.Provider value={{ appBridgeClient }}>{children}</AppBridgeContext.Provider>;
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
