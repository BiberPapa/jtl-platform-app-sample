import { Alert, Button, Card, CardContent, Checkbox } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
import { AppPageShell } from '../../components';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { connectTenant } from '../../services/setupService';

type SetupStep = 'terms' | 'connection' | 'success';
type ConnectionState = 'idle' | 'submitting' | 'success' | 'error';

function SetupPage() {
  const [currentStep, setCurrentStep] = useState<SetupStep>('terms');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [completionState, setCompletionState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [showManualCloseHint, setShowManualCloseHint] = useState(false);
  const appBridgeClient = useAppBridgeClient();

  useEffect(() => {
    if (currentStep !== 'success' || completionState !== 'idle') {
      return;
    }

    let cancelled = false;

    const finalizeSetup = async (): Promise<void> => {
      try {
        setCompletionState('submitting');
        await appBridgeClient.setupCompleted();

        if (!cancelled) {
          setCompletionState('done');
          setCompletionMessage('Setup was successfully submitted to the host.');
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Setup completion could not be reported to the host.';
          setCompletionState('error');
          setCompletionMessage(message);
        }
      }
    };

    void finalizeSetup();

    return () => {
      cancelled = true;
    };
  }, [appBridgeClient, completionState, currentStep]);

  const handleConnectionTest = useCallback(async (): Promise<void> => {
    try {
      setConnectionState('submitting');
      setConnectionMessage('Please wait while the connection to JTL-Wawi is being checked.');
      setShowManualCloseHint(false);
      const { message } = await connectTenant(appBridgeClient);
      setConnectionState('success');
      setConnectionMessage(message);
      setCompletionState('idle');
      setCompletionMessage(null);
      setCurrentStep('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred while testing the connection.';
      setConnectionState('error');
      setConnectionMessage(message);
    }
  }, [appBridgeClient]);

  const handleOpenConnectionStep = useCallback(() => {
    if (!hasAcceptedTerms) {
      return;
    }

    setCurrentStep('connection');
    setConnectionState('idle');
    setConnectionMessage(null);
  }, [hasAcceptedTerms]);

  const handleShowManualCloseHint = useCallback(() => {
    setShowManualCloseHint(true);
  }, []);

  const isBusy = connectionState === 'submitting' || completionState === 'submitting';
  const stepLabel = currentStep === 'terms' ? 'Step 1 of 3' : currentStep === 'connection' ? 'Step 2 of 3' : 'Step 3 of 3';
  const stepTitle =
    currentStep === 'terms' ? 'Confirm terms and conditions' : currentStep === 'connection' ? 'Test connection to JTL-Wawi' : 'Setup completed';
  const leadText =
    currentStep === 'terms'
      ? 'Please open the terms and conditions in a new window and then confirm your consent.'
      : currentStep === 'connection'
        ? 'Start the connection test manually so the app can verify the tenant connection.'
        : 'The tenant connection has been prepared successfully and the host has been informed that setup is complete.';

  return (
    <AppPageShell eyebrow="Setup" title={stepTitle} lead={leadText} width="compact">
      <Card>
        <CardContent className="app-section-grid">
          <div className="app-section-header" aria-label={stepLabel}>
            <p className="app-muted-text">{stepLabel}</p>
            <p className="app-muted-text">{currentStep === 'terms' ? 'Consent' : currentStep === 'connection' ? 'Connection test' : 'Completion'}</p>
          </div>
          {currentStep === 'terms' ? (
            <>
              <div className="app-section-grid">
                <a className="app-link" href="/terms-of-use" target="_blank" rel="noreferrer noopener">
                  Open terms and conditions in a new window
                </a>
                <Checkbox
                  label="I have read and agree to the terms and conditions."
                  value={hasAcceptedTerms}
                  onChange={checked => {
                    setHasAcceptedTerms(Boolean(checked));
                  }}
                />
              </div>
              <Alert title="You cannot continue to the connection test without active consent." variant="info" closable={false} />
              <div className="app-page-actions">
                <Button onClick={handleOpenConnectionStep} label="Continue" disabled={!hasAcceptedTerms} />
              </div>
            </>
          ) : null}
          {currentStep === 'connection' ? (
            <>
              <Alert
                title={connectionMessage ?? 'The test will start after you click the button.'}
                variant={connectionState === 'error' ? 'destructive' : connectionState === 'success' ? 'success' : 'info'}
                closable={false}
              />
              <div className="app-page-actions">
                <Button
                  onClick={() => {
                    void handleConnectionTest();
                  }}
                  label={connectionState === 'submitting' ? 'Checking connection...' : 'Test connection'}
                  disabled={isBusy}
                />
              </div>
            </>
          ) : null}
          {currentStep === 'success' ? (
            <>
              <Alert
                title={
                  completionState === 'error'
                    ? (completionMessage ?? 'Setup completion could not be reported to the host.')
                    : completionState === 'submitting'
                      ? 'The host is being informed that setup completed successfully.'
                      : (connectionMessage ?? 'The tenant connection has been prepared successfully.')
                }
                variant={completionState === 'error' ? 'destructive' : 'success'}
                closable={false}
              />
              {completionMessage && completionState !== 'submitting' ? <p className="app-muted-text">{completionMessage}</p> : null}
              {showManualCloseHint ? (
                <p className="app-muted-text">You can now close this window manually and return to the host application.</p>
              ) : null}
              <div className="app-page-actions">
                <Button onClick={handleShowManualCloseHint} label="Done" disabled={completionState === 'submitting'} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </AppPageShell>
  );
}

export default SetupPage;
