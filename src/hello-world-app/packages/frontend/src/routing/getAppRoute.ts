export type AppRoute =
  | { kind: 'setup' }
  | { kind: 'support' }
  | { kind: 'privacy' }
  | { kind: 'terms-of-use' }
  | { kind: 'pane' }
  | { kind: 'erp-home' }
  | { kind: 'erp-menu-item'; menuItemId: string }
  | { kind: 'erp-tab'; tabId: string }
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

  if (normalizedPath === 'pane') {
    return { kind: 'pane' };
  }

  if (normalizedPath === 'erp') {
    return { kind: 'erp-home' };
  }

  const pathSegments = normalizedPath.split('/');

  if (pathSegments.length === 3 && pathSegments[0] === 'erp' && pathSegments[1] === 'menu') {
    const menuItemId = pathSegments[2];

    if (menuItemId) {
      return { kind: 'erp-menu-item', menuItemId };
    }
  }

  if (pathSegments.length === 3 && pathSegments[0] === 'erp' && pathSegments[1] === 'tabs') {
    const tabId = pathSegments[2];

    if (tabId) {
      return { kind: 'erp-tab', tabId };
    }
  }

  return { kind: 'unknown' };
}
