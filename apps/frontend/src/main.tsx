import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@jtl-software/platform-ui-react';
import './services/setupGraphiQlWorkers';
import App from './App';
import './index.css';
import { AppBridgeProvider } from './services/appBridgeContext';
import { createRuntimeAppBridgeClient } from './services/runtimeAppBridgeClient';

function getRootElement(): HTMLElement {
  const element = document.getElementById('root');

  if (!(element instanceof HTMLElement)) {
    throw new Error('Expected a root element with the id "root".');
  }

  return element;
}

function renderApp(): void {
  void (async () => {
    const appBridgeClient = await createRuntimeAppBridgeClient();

    createRoot(getRootElement()).render(
      <StrictMode>
        <ThemeProvider defaultTheme="system">
          <AppBridgeProvider appBridgeClient={appBridgeClient}>
            <App />
          </AppBridgeProvider>
        </ThemeProvider>
      </StrictMode>,
    );
  })();
}

renderApp();
