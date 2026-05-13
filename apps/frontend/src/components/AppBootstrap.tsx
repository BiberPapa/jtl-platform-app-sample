import { Alert } from '@jtl-software/platform-ui-react';
import { useEffect, useState } from 'react';
import App from '../App';
import { type AppBridgeClient } from '../services/appBridgeClient';
import { AppBridgeProvider } from '../services/appBridgeContext';
import { createRuntimeAppBridgeClient } from '../services/runtimeAppBridgeClient';
import { getAppRoute, needsAppBridge } from '../routing/getAppRoute';
import AppPageShell from './AppPageShell';

type AppBootstrapProps = {
  loadAppBridgeClient?: () => Promise<AppBridgeClient>;
};

type AppBootstrapState =
  | { status: 'no-bridge-needed'; appBridgeClient: null }
  | { status: 'loading-bridge' }
  | { status: 'bridge-ready'; appBridgeClient: AppBridgeClient }
  | { status: 'bridge-failed'; message: string };

function AppBootstrap({ loadAppBridgeClient = createRuntimeAppBridgeClient }: AppBootstrapProps) {
  const route = getAppRoute(new URL(window.location.href));
  const bridgeRequired = needsAppBridge(route);

  // If this route doesn't need AppBridge, render immediately without initializing it
  if (!bridgeRequired) {
    return <App />;
  }

  // For routes that require AppBridge, initialize it
  return <AppBootstrapWithBridge loadAppBridgeClient={loadAppBridgeClient} />;
}

type AppBootstrapWithBridgeProps = {
  loadAppBridgeClient: () => Promise<AppBridgeClient>;
};

function AppBootstrapWithBridge({ loadAppBridgeClient }: AppBootstrapWithBridgeProps) {
  const [bootstrapState, setBootstrapState] = useState<AppBootstrapState>({ status: 'loading-bridge' });

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const appBridgeClient = await loadAppBridgeClient();

        if (isActive) {
          setBootstrapState({
            status: 'bridge-ready',
            appBridgeClient,
          });
        }
      } catch (error) {
        if (isActive) {
          setBootstrapState({
            status: 'bridge-failed',
            message: getBootstrapFailureMessage(error),
          });
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [loadAppBridgeClient]);

  if (bootstrapState.status === 'bridge-ready') {
    return (
      <AppBridgeProvider appBridgeClient={bootstrapState.appBridgeClient}>
        <App />
      </AppBridgeProvider>
    );
  }

  return (
    <AppPageShell
      eyebrow="Cloud App"
      title={bootstrapState.status === 'loading-bridge' ? 'Loading app shell' : 'App startup failed'}
      lead={
        bootstrapState.status === 'loading-bridge'
          ? 'Connecting to JTL Hub and initializing the app.'
          : 'The application could not initialize AppBridge. This page must be opened from within the JTL Hub or Cloud ERP.'
      }
      width="compact"
    >
      <Alert
        title={bootstrapState.status === 'loading-bridge' ? 'Initializing app...' : 'The application could not be initialized.'}
        description={bootstrapState.status === 'bridge-failed' ? bootstrapState.message : undefined}
        variant={bootstrapState.status === 'bridge-failed' ? 'destructive' : 'info'}
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
