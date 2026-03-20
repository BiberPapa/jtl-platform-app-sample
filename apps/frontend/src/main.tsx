import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createAppBridge } from '@jtl-software/cloud-apps-core';
import { ThemeProvider } from '@jtl-software/platform-ui-react';
import App from './App';
import './index.css';
import { AppBridgeProvider } from './services/appBridgeContext';

function getRootElement(): HTMLElement {
  const element = document.getElementById('root');

  if (!(element instanceof HTMLElement)) {
    throw new Error('Expected a root element with the id "root".');
  }

  return element;
}

async function bootstrap(): Promise<void> {
  const appBridge = await createAppBridge();

  createRoot(getRootElement()).render(
    <StrictMode>
      <ThemeProvider defaultTheme="system">
        <AppBridgeProvider appBridge={appBridge}>
          <App />
        </AppBridgeProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

void bootstrap();
