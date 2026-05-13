import type { AppRoute } from '../../routing/getAppRoute';
import ApiDashboardPage from './ApiDashboardPage';
import ErpDashboardPage from './ErpDashboardPage';
import UnknownErpPage from './UnknownErpPage';

type ErpPageProps = {
  route: Extract<AppRoute, { kind: 'erp-menu-item' }>;
};

function ErpPage({ route }: ErpPageProps) {
  return route.menuItemId === 'Dashboard' ? (
    <ErpDashboardPage />
  ) : route.menuItemId === 'ApiDashboard' ? (
    <ApiDashboardPage />
  ) : (
    <UnknownErpPage kind="erp-menu-item" menuItemId={route.menuItemId} />
  );
}

export default ErpPage;
