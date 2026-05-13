import './App.css';
import { Card, CardContent } from '@jtl-software/platform-ui-react';
import { AppErrorDisplay, AppPageShell } from './components';
import { ErpPage, PanePage, PrivacyPage, SetupPage, SupportPage, TermsOfUsePage } from './pages';
import { getAppRoute } from './routing/getAppRoute';
import { AppErrorProvider } from './services/appErrorContext';

function App() {
  const route = getAppRoute(new URL(window.location.href));

  return (
    <AppErrorProvider>
      <AppErrorDisplay />
      {renderRoute(route)}
    </AppErrorProvider>
  );
}

export default App;

function renderRoute(route: ReturnType<typeof getAppRoute>) {
  switch (route.kind) {
    case 'setup':
      return <SetupPage />;
    case 'support':
      return <SupportPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'terms-of-use':
      return <TermsOfUsePage />;
    case 'erp-menu-item':
      return <ErpPage route={route} />;
    case 'erp-pane':
      return <PanePage />;
    default:
      return (
        <AppPageShell
          eyebrow="Cloud App"
          title="Unknown app mode"
          lead="This app is an ERP-only plugin. Use `/setup`, `/support`, `/privacy`, `/terms-of-use`, `/erp/menu/<id>`, or `/erp/pane/<id>` to open one of the documented entry points."
        >
          <Card>
            <CardContent>
              <p className="app-muted-text">Open one of the documented ERP-specific entry points to continue.</p>
            </CardContent>
          </Card>
        </AppPageShell>
      );
  }
}
