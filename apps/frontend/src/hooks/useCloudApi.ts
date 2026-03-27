import { type Context, useContext, useEffect, useState } from 'react';
import type { AppBridgeClient } from '../services/appBridgeClient';
import { AppBridgeContext } from '../services/appBridgeContext';
import { fetchTenants, fetchDefaultTenant } from '../services/tenantsService';
import { fetchUserSettings } from '../services/userSettingsService';
import { fetchCurrentSession, getCurrentUser } from '../services/sessionService';
import { fetchErpInstanceStatus, isErpInstanceConnected } from '../services/erpStatusService';
import type { Tenant } from '../types/jtlCloudApi';

type UseQueryState<T> = {
  data?: T;
  isLoading: boolean;
  error?: Error;
};

/**
 * Generic hook for fetching cloud API data
 */
function useCloudApiQuery<T>(fetcher: (client: AppBridgeClient) => Promise<T>, dependencies: unknown[] = []): UseQueryState<T> {
  const appBridgeClient = useContext(AppBridgeContext as unknown as Context<AppBridgeClient | undefined>);
  const [state, setState] = useState<UseQueryState<T>>({
    isLoading: true,
  });

  useEffect(() => {
    if (!appBridgeClient) {
      setState({
        isLoading: false,
        error: new Error('AppBridge not available'),
      });
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setState({ isLoading: true });
        const data = await fetcher(appBridgeClient);

        if (isMounted) {
          setState({
            data,
            isLoading: false,
          });
        }
      } catch (error: unknown) {
        if (isMounted) {
          const err = error instanceof Error ? error : new Error(String(error));
          setState({
            isLoading: false,
            error: err,
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [appBridgeClient, ...dependencies]);

  return state;
}

/**
 * Hook to fetch list of tenants
 * @example
 * const { data: tenants, isLoading, error } = useTenants();
 */
export function useTenants() {
  return useCloudApiQuery(client => fetchTenants(client));
}

/**
 * Hook to fetch the default (first) tenant
 */
export function useDefaultTenant() {
  return useCloudApiQuery(client => fetchDefaultTenant(client));
}

/**
 * Hook to fetch user settings
 * @example
 * const { data: settings, isLoading } = useUserSettings();
 */
export function useUserSettings() {
  return useCloudApiQuery(client => fetchUserSettings(client));
}

/**
 * Hook to fetch current session information
 * @example
 * const { data: session, isLoading } = useCurrentSession();
 * if (session?.identity) {
 *   console.log('User email:', session.identity.traits.email);
 * }
 */
export function useCurrentSession() {
  return useCloudApiQuery(client => fetchCurrentSession(client));
}

/**
 * Hook to fetch current user information
 * @example
 * const { data: user, isLoading } = useCurrentUser();
 */
export function useCurrentUser() {
  return useCloudApiQuery(client => getCurrentUser(client));
}

/**
 * Hook to fetch ERP instance status
 * @example
 * const { data: status, isLoading } = useErpInstanceStatus();
 * if (status?.metadata.connected) {
 *   console.log('ERP is connected');
 * }
 */
export function useErpInstanceStatus() {
  return useCloudApiQuery(client => fetchErpInstanceStatus(client));
}

/**
 * Hook to check if ERP instance is connected
 */
export function useIsErpConnected() {
  return useCloudApiQuery(client => isErpInstanceConnected(client));
}

/**
 * Hook to fetch specific tenant by ID
 */
export function useTenant(tenantId: string) {
  const appBridgeClient = useContext(AppBridgeContext as unknown as Context<AppBridgeClient | undefined>);
  const [state, setState] = useState<UseQueryState<Tenant>>({
    isLoading: true,
  });

  useEffect(() => {
    if (!appBridgeClient || !tenantId) {
      if (!tenantId) {
        return;
      }
      setState({
        isLoading: false,
        error: new Error('AppBridge not available'),
      });
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setState({ isLoading: true });
        const tenants = await fetchTenants(appBridgeClient);
        const tenant = tenants.find(t => t.id === tenantId);

        if (!tenant) {
          throw new Error(`Tenant ${tenantId} not found`);
        }

        if (isMounted) {
          setState({
            data: tenant,
            isLoading: false,
          });
        }
      } catch (error: unknown) {
        if (isMounted) {
          const err = error instanceof Error ? error : new Error(String(error));
          setState({
            isLoading: false,
            error: err,
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [appBridgeClient, tenantId]);

  return state;
}
