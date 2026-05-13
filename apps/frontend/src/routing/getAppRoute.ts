export type AppRoute =
  | { kind: 'setup' }
  | { kind: 'support' }
  | { kind: 'privacy' }
  | { kind: 'terms-of-use' }
  | { kind: 'erp-pane' }
  | { kind: 'erp-menu-item'; menuItemId: string }
  | { kind: 'unknown' };

export function getAppRoute(url: URL): AppRoute {
  const normalizedPath = url.pathname.replace(/^\/+|\/+$/g, '');

  if (normalizedPath === 'setup') {
    return { kind: 'setup' };
  }

  if (normalizedPath === 'support') {
    return { kind: 'support' };
  }

  if (normalizedPath === 'privacy') {
    return { kind: 'privacy' };
  }

  if (normalizedPath === 'terms-of-use') {
    return { kind: 'terms-of-use' };
  }

  const pathSegments = normalizedPath.split('/');

  if (pathSegments.length === 3 && pathSegments[0] === 'erp' && pathSegments[1] === 'menu') {
    const menuItemId = pathSegments[2];

    if (menuItemId) {
      return { kind: 'erp-menu-item', menuItemId };
    }
  }

  if (pathSegments.length === 3 && pathSegments[0] === 'erp' && pathSegments[1] === 'pane') {
    return { kind: 'erp-pane' };
  }

  return { kind: 'unknown' };
}

/**
 * Determine if a route requires AppBridge integration.
 *
 * Routes that require AppBridge:
 * - setup: Lifecycle endpoint called from JTL Hub
 * - erp-menu-item: ERP menu item, runs inside the hub
 * - erp-pane: Context pane, runs inside the hub
 *
 * Routes that do NOT require AppBridge:
 * - support, privacy, terms-of-use: Static info pages, can render standalone
 * - unknown: Invalid route, should show error
 */
export function needsAppBridge(route: AppRoute): boolean {
  switch (route.kind) {
    case 'setup':
    case 'erp-menu-item':
    case 'erp-pane':
      return true;
    case 'support':
    case 'privacy':
    case 'terms-of-use':
    case 'unknown':
      return false;
  }
}
