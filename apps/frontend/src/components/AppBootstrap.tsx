import { Alert } from '@jtl-software/platform-ui-react';
import { useEffect, useState } from 'react';
import App from '../App';
import type { AppBridgeClient } from '../services/appBridgeClient';
import { AppBridgeProvider } from '../services/appBridgeContext';
import { createRuntimeAppBridgeClient } from '../services/runtimeAppBridgeClient';
import AppPageShell from './AppPageShell';

type AppBootstrapProps = {
  loadAppBridgeClient?: () => Promise<AppBridgeClient>;
};

type AppBootstrapState = { status: 'loading' } | { status: 'ready'; appBridgeClient: AppBridgeClient } | { status: 'failed'; message: string };

function AppBootstrap({ loadAppBridgeClient = createRuntimeAppBridgeClient }: AppBootstrapProps) {
  const [bootstrapState, setBootstrapState] = useState<AppBootstrapState>({ status: 'loading' });

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const appBridgeClient = await loadAppBridgeClient();

        if (isActive) {
          setBootstrapState({
            status: 'ready',
            appBridgeClient,
          });
        }
      } catch (error) {
        if (isActive) {
          setBootstrapState({
            status: 'failed',
            message: getBootstrapFailureMessage(error),
          });
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [loadAppBridgeClient]);

  if (bootstrapState.status === 'ready') {
    return (
      <AppBridgeProvider appBridgeClient={bootstrapState.appBridgeClient}>
        <App />
      </AppBridgeProvider>
    );
  }

  return (
    <AppPageShell
      eyebrow="Cloud App"
      title={bootstrapState.status === 'loading' ? 'Loading app shell' : 'App startup failed'}
      lead={
        bootstrapState.status === 'loading'
          ? 'Preparing the runtime bridge and application shell.'
          : 'The application could not be initialized. Refresh the page or check the host environment.'
      }
      width="compact"
    >
      <Alert
        title={bootstrapState.status === 'loading' ? 'Initializing app...' : 'The application could not be initialized.'}
        description={bootstrapState.status === 'failed' ? bootstrapState.message : undefined}
        variant={bootstrapState.status === 'failed' ? 'destructive' : 'info'}
        closable={false}
      />
    </AppPageShell>
  );
}

function getBootstrapFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected startup error occurred while creating the app bridge client.';
}

export default AppBootstrap;
