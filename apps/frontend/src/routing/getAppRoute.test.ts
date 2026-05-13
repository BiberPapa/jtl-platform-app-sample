import { describe, expect, it } from 'vitest';
import { getAppRoute, needsAppBridge } from './getAppRoute';

describe('getAppRoute', () => {
  it('returns setup, legal, and static routes for their fixed paths', () => {
    expect(getAppRoute(new URL('http://localhost:6142/setup'))).toEqual({ kind: 'setup' });
    expect(getAppRoute(new URL('http://localhost:6142/support'))).toEqual({ kind: 'support' });
    expect(getAppRoute(new URL('http://localhost:6142/privacy'))).toEqual({ kind: 'privacy' });
    expect(getAppRoute(new URL('http://localhost:6142/terms-of-use'))).toEqual({ kind: 'terms-of-use' });
  });

  it('returns ERP pane route for /erp/pane path', () => {
    expect(getAppRoute(new URL('http://localhost:6142/erp/pane/orders'))).toEqual({
      kind: 'erp-pane',
    });
  });

  it('parses ERP menu item routes from the erp menu path', () => {
    expect(getAppRoute(new URL('http://localhost:6142/erp/menu/ApiDashboard'))).toEqual({
      kind: 'erp-menu-item',
      menuItemId: 'ApiDashboard',
    });
    expect(getAppRoute(new URL('http://localhost:6142/erp/menu/Dashboard'))).toEqual({
      kind: 'erp-menu-item',
      menuItemId: 'Dashboard',
    });
    expect(getAppRoute(new URL('http://localhost:6142/erp/menu/Swagger'))).toEqual({
      kind: 'erp-menu-item',
      menuItemId: 'Swagger',
    });
  });

  it('returns unknown for unsupported paths', () => {
    expect(getAppRoute(new URL('http://localhost:6142/unknown'))).toEqual({ kind: 'unknown' });
  });
});

describe('needsAppBridge', () => {
  it('returns true for ERP-integrated routes', () => {
    expect(needsAppBridge({ kind: 'setup' })).toBe(true);
    expect(needsAppBridge({ kind: 'erp-menu-item', menuItemId: 'Dashboard' })).toBe(true);
    expect(needsAppBridge({ kind: 'erp-pane' })).toBe(true);
  });

  it('returns false for static info pages', () => {
    expect(needsAppBridge({ kind: 'support' })).toBe(false);
    expect(needsAppBridge({ kind: 'privacy' })).toBe(false);
    expect(needsAppBridge({ kind: 'terms-of-use' })).toBe(false);
  });

  it('returns false for unknown routes', () => {
    expect(needsAppBridge({ kind: 'unknown' })).toBe(false);
  });
});
