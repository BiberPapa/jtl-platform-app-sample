import './App.css';
import { ErpPage, PanePage, SetupPage } from './pages';
import { getAppMode } from './routing/getAppMode';

function App() {
  const mode = getAppMode(window.location.pathname);

  switch (mode) {
    case 'setup':
      return <SetupPage />;
    case 'erp':
      return <ErpPage />;
    case 'pane':
      return <PanePage />;
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
