import { lazy, type ComponentType } from 'react';
import type { AppRoute } from '../../routing/getAppRoute';
import DashboardPage from './DashboardPage';
import ErpHomePage from './ErpHomePage';
import ExampleTab1Page from './ExampleTab1Page';
import ExampleTab2Page from './ExampleTab2Page';

const SwaggerPage = lazy(async () => import('./SwaggerPage'));

export type ResolvedErpPage =
  | { kind: 'known'; component: ComponentType }
  | { kind: 'unknown-menu-item'; menuItemId: string }
  | { kind: 'unknown-tab'; tabId: string };

type ErpRoute = Extract<AppRoute, { kind: 'erp-home' | 'erp-menu-item' | 'erp-tab' }>;

const menuPageRegistry: Record<string, ComponentType> = {
  Dashboard: DashboardPage,
  Swagger: SwaggerPage,
};

const tabPageRegistry: Record<string, ComponentType> = {
  ExampleTab1: ExampleTab1Page,
  ExampleTab2: ExampleTab2Page,
};

export function resolveErpPage(route: ErpRoute): ResolvedErpPage {
  switch (route.kind) {
    case 'erp-home':
      return { kind: 'known', component: ErpHomePage };
    case 'erp-menu-item': {
      const component = menuPageRegistry[route.menuItemId];

      return component ? { kind: 'known', component } : { kind: 'unknown-menu-item', menuItemId: route.menuItemId };
    }
    case 'erp-tab': {
      const component = tabPageRegistry[route.tabId];

      return component ? { kind: 'known', component } : { kind: 'unknown-tab', tabId: route.tabId };
    }
  }
}
