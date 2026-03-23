import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@jtl-software/platform-ui-react';
import './index.css';
import { AppBootstrap } from './components';

function getRootElement(): HTMLElement {
  const element = document.getElementById('root');

  if (!(element instanceof HTMLElement)) {
    throw new Error('Expected a root element with the id "root".');
  }

  return element;
}

createRoot(getRootElement()).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <AppBootstrap />
    </ThemeProvider>
  </StrictMode>,
);
