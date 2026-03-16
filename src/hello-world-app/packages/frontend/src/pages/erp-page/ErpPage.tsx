import type { AppRoute } from '../../routing/getAppRoute';
import { resolveErpPage } from './erpPageRegistry';
import UnknownErpPage from './UnknownErpPage';

type ErpPageProps = {
  route: Extract<AppRoute, { kind: 'erp-home' | 'erp-menu-item' | 'erp-tab' }>;
};

function ErpPage({ route }: ErpPageProps) {
  const resolvedPage = resolveErpPage(route);

  switch (resolvedPage.kind) {
    case 'known': {
      const PageComponent = resolvedPage.component;
      return <PageComponent />;
    }
    case 'unknown-menu-item':
      return <UnknownErpPage kind="erp-menu-item" menuItemId={resolvedPage.menuItemId} />;
    case 'unknown-tab':
      return <UnknownErpPage kind="erp-tab" tabId={resolvedPage.tabId} />;
  }
}

export default ErpPage;
