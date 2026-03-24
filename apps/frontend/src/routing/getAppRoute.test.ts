import { describe, expect, it } from 'vitest';
import { getAppRoute } from './getAppRoute';

describe('getAppRoute', () => {
  it('returns setup, legal and pane routes for their fixed paths', () => {
    expect(getAppRoute(new URL('http://localhost:6142/'))).toEqual({ kind: 'developer-home' });
    expect(getAppRoute(new URL('http://localhost:6142/setup'))).toEqual({ kind: 'setup' });
    expect(getAppRoute(new URL('http://localhost:6142/support'))).toEqual({ kind: 'support' });
    expect(getAppRoute(new URL('http://localhost:6142/privacy'))).toEqual({ kind: 'privacy' });
    expect(getAppRoute(new URL('http://localhost:6142/terms-of-use'))).toEqual({ kind: 'terms-of-use' });
    expect(getAppRoute(new URL('http://localhost:6142/hub'))).toEqual({ kind: 'hub' });
    expect(getAppRoute(new URL('http://localhost:6142/pane'))).toEqual({ kind: 'pane' });
  });

  it('distinguishes ERP home and ERP menu item routes', () => {
    expect(getAppRoute(new URL('http://localhost:6142/erp'))).toEqual({ kind: 'erp-home' });
    expect(getAppRoute(new URL('http://localhost:6142/erp/menu/ApiDashboard'))).toEqual({
      kind: 'erp-menu-item',
      menuItemId: 'ApiDashboard',
    });
    expect(getAppRoute(new URL('http://localhost:6142/erp/menu/ApiTest'))).toEqual({
      kind: 'erp-menu-item',
      menuItemId: 'ApiTest',
    });
    expect(getAppRoute(new URL('http://localhost:6142/erp/menu/Swagger'))).toEqual({
      kind: 'erp-menu-item',
      menuItemId: 'Swagger',
    });
  });

  it('parses ERP tab routes from the wawi tabs path', () => {
    expect(getAppRoute(new URL('http://localhost:6142/erp/tabs/ExampleTab2'))).toEqual({
      kind: 'erp-tab',
      tabId: 'ExampleTab2',
    });
  });

  it('returns unknown for unsupported paths', () => {
    expect(getAppRoute(new URL('http://localhost:6142/unknown'))).toEqual({ kind: 'unknown' });
  });
});
