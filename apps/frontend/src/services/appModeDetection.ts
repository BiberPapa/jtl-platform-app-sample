import type { AppRoute } from '../routing/getAppRoute';

export type AppMode = 'erp-embedded';

/**
 * Determines which app mode is required based on the route.
 * ERP-embedded mode: requires AppBridge and tenant context from JTL ERP.
 * Static pages (setup, support, etc.) also require AppBridge for lifecycle management.
 */
export function getRequiredAppMode(route: AppRoute): AppMode {
  switch (route.kind) {
    // All routes require AppBridge in ERP-only mode
    case 'setup':
    case 'support':
    case 'privacy':
    case 'terms-of-use':
    case 'erp-menu-item':
    case 'erp-pane':
      return 'erp-embedded';

    case 'unknown':
    default:
      return 'erp-embedded';
  }
}

/**
 * Whether the AppBridge must be available for this route.
 * In ERP-only mode, all routes require AppBridge.
 */
export function requiresAppBridge(): boolean {
  return true;
}
