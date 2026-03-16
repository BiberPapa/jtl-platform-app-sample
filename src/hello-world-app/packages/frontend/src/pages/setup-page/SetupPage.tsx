import { Button } from '@jtl-software/platform-ui-react';
import { useCallback, useState } from 'react';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { connectTenant } from '../../services/setupService';

type SetupState = { status: 'idle' } | { status: 'submitting' } | { status: 'success'; message: string } | { status: 'error'; message: string };

function SetupPage() {
  const [setupState, setSetupState] = useState<SetupState>({ status: 'idle' });
  const appBridgeClient = useAppBridgeClient();

  const handleSetupCompleted = useCallback(async (): Promise<void> => {
    try {
      setSetupState({ status: 'submitting' });
      const sessionToken = await appBridgeClient.getSessionToken();

      const { message } = await connectTenant(sessionToken);
      await appBridgeClient.setupCompleted();
      setSetupState({ status: 'success', message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during setup.';
      setSetupState({ status: 'error', message });
    }
  }, [appBridgeClient]);

  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="setup-title">
        <p className="eyebrow">Setup</p>
        <h1 id="setup-title">Connect the tenant</h1>
        <p>
          This demo shows a minimal setup flow: obtain a session token from the app bridge, validate it in the backend and then confirm the app
          activation.
        </p>
        {setupState.status === 'submitting' ? (
          <p className="status-text" aria-live="polite">
            Please wait while the tenant connection is being established.
          </p>
        ) : null}
        {setupState.status === 'error' ? (
          <p className="status-text" data-status="error" role="alert">
            {setupState.message}
          </p>
        ) : null}
        {setupState.status === 'success' ? (
          <p className="status-text" data-status="success" aria-live="polite">
            {setupState.message}
          </p>
        ) : null}
        <Button
          onClick={() => {
            void handleSetupCompleted();
          }}
          label={setupState.status === 'submitting' ? 'Connecting…' : 'Setup App'}
        />
      </section>
    </main>
  );
}

export default SetupPage;
