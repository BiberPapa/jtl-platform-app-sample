import { Suspense } from 'react';
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
      return (
        <Suspense
          fallback={
            <main className="app-shell">
              <section className="app-card page-stack" aria-labelledby="erp-page-loading-title">
                <p className="eyebrow">ERP</p>
                <h1 id="erp-page-loading-title">Loading page</h1>
                <p>The requested ERP page is loading.</p>
              </section>
            </main>
          }
        >
          <PageComponent />
        </Suspense>
      );
    }
    case 'unknown-menu-item':
      return <UnknownErpPage kind="erp-menu-item" menuItemId={resolvedPage.menuItemId} />;
    case 'unknown-tab':
      return <UnknownErpPage kind="erp-tab" tabId={resolvedPage.tabId} />;
  }
}

export default ErpPage;
