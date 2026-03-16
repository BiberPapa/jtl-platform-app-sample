import type { AppBridge } from '@jtl-software/cloud-apps-core';
import './App.css';
import { ErpPage, PanePage, SetupPage } from './pages';
import { getAppMode } from './routing/getAppMode';

type AppProps = {
  appBridge: AppBridge;
};

function App({ appBridge }: AppProps) {
  const mode = getAppMode(window.location.pathname);

  switch (mode) {
    case 'setup':
      return <SetupPage appBridge={appBridge} />;
    case 'erp':
      return <ErpPage appBridge={appBridge} />;
    case 'pane':
      return <PanePage appBridge={appBridge} />;
    default:
      return (
        <main className="app-shell">
          <section className="app-card page-stack" aria-labelledby="unknown-mode-title">
            <p className="eyebrow">Hello World App</p>
            <h1 id="unknown-mode-title">Unknown app mode</h1>
            <p>Use `/setup`, `/erp` or `/pane` to open one of the documented demo entry points.</p>
          </section>
        </main>
      );
  }
}

export default App;
