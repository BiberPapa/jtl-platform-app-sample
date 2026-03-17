import './App.css';
import { ErpPage, HubPage, PanePage, PrivacyPage, SetupPage, SupportPage, TermsOfUsePage } from './pages';
import { getAppRoute } from './routing/getAppRoute';

function App() {
  const route = getAppRoute(new URL(window.location.href));

  switch (route.kind) {
    case 'setup':
      return <SetupPage />;
    case 'support':
      return <SupportPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'terms-of-use':
      return <TermsOfUsePage />;
    case 'hub':
      return <HubPage />;
    case 'erp-home':
    case 'erp-menu-item':
    case 'erp-tab':
      return <ErpPage route={route} />;
    case 'pane':
      return <PanePage />;
    default:
      return (
        <main className="app-shell">
          <section className="app-card page-stack" aria-labelledby="unknown-mode-title">
            <p className="eyebrow">Cloud App</p>
            <h1 id="unknown-mode-title">Unknown app mode</h1>
            <p>
              Use `/setup`, `/support`, `/privacy`, `/terms-of-use`, `/hub`, `/erp`, `/erp/menu/Dashboard`, `/erp/menu/Swagger`, `/erp/tabs/...` or
              `/pane` to open one of the documented app entry points.
            </p>
          </section>
        </main>
      );
  }
}

export default App;
