import type { ComponentType } from 'react';
import type { AppRoute } from '../../routing/getAppRoute';
import ErpHomePage from './ErpHomePage';
import ExamplePage1Page from './ExamplePage1Page';
import ExamplePage2Page from './ExamplePage2Page';
import ExamplePage3Page from './ExamplePage3Page';
import ExampleTab1Page from './ExampleTab1Page';
import ExampleTab2Page from './ExampleTab2Page';

export type ResolvedErpPage =
  | { kind: 'known'; component: ComponentType }
  | { kind: 'unknown-menu-item'; menuItemId: string }
  | { kind: 'unknown-tab'; tabId: string };

type ErpRoute = Extract<AppRoute, { kind: 'erp-home' | 'erp-menu-item' | 'erp-tab' }>;

const menuPageRegistry: Record<string, ComponentType> = {
  ExamplePage1: ExamplePage1Page,
  ExamplePage2: ExamplePage2Page,
  ExamplePage3: ExamplePage3Page,
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
