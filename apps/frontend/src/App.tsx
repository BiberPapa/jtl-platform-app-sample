import './App.css';
import { Card, CardContent } from '@jtl-software/platform-ui-react';
import { AppPageShell } from './components';
import { DeveloperHomePage, ErpPage, HubPage, PanePage, PrivacyPage, SetupPage, SupportPage, TermsOfUsePage } from './pages';
import { getAppRoute } from './routing/getAppRoute';
import { AppErrorProvider } from './services/appErrorContext';

function App() {
  const route = getAppRoute(new URL(window.location.href));

  return <AppErrorProvider>{renderRoute(route)}</AppErrorProvider>;
}

export default App;

function renderRoute(route: ReturnType<typeof getAppRoute>) {
  switch (route.kind) {
    case 'developer-home':
      return <DeveloperHomePage />;
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
        <AppPageShell
          eyebrow="Cloud App"
          title="Unknown app mode"
          lead="Use `/`, `/setup`, `/support`, `/privacy`, `/terms-of-use`, `/hub`, `/erp`, `/erp/menu/Dashboard`, `/erp/tabs/...` or `/pane` to open one of the documented app entry points."
        >
          <Card>
            <CardContent>
              <p className="app-muted-text">Open one of the documented frontend entry points to continue.</p>
            </CardContent>
          </Card>
        </AppPageShell>
      );
  }
}
