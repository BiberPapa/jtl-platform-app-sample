import type { AppRoute } from '../../routing/getAppRoute';
import ApiDashboardPage from './ApiDashboardPage';
import ErpDashboardPage from './ErpDashboardPage';
import UnknownErpPage from './UnknownErpPage';

type ErpPageProps = {
  route: Extract<AppRoute, { kind: 'erp-home' | 'erp-menu-item' | 'erp-tab' }>;
};

function ErpPage({ route }: ErpPageProps) {
  switch (route.kind) {
    case 'erp-home':
      return <ApiDashboardPage />;
    case 'erp-menu-item':
      return route.menuItemId === 'Dashboard' ? (
        <ErpDashboardPage />
      ) : route.menuItemId === 'ApiDashboard' ? (
        <ApiDashboardPage />
      ) : (
        <UnknownErpPage kind="erp-menu-item" menuItemId={route.menuItemId} />
      );
    case 'erp-tab':
      return <UnknownErpPage kind="erp-tab" tabId={route.tabId} />;
  }
}

export default ErpPage;
