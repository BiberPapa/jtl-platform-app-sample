import { Button } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
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
          setCompletionMessage('Die Einrichtung wurde erfolgreich an den Host übermittelt.');
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Der Setup-Abschluss konnte nicht an den Host gemeldet werden.';
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
      setConnectionMessage('Bitte warten, während die Verbindung zur JTL-Wawi geprüft wird.');
      setShowManualCloseHint(false);
      const sessionToken = await appBridgeClient.getSessionToken();
      const { message } = await connectTenant(sessionToken);
      setConnectionState('success');
      setConnectionMessage(message);
      setCompletionState('idle');
      setCompletionMessage(null);
      setCurrentStep('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Beim Verbindungstest ist ein unerwarteter Fehler aufgetreten.';
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
  const stepLabel = currentStep === 'terms' ? 'Schritt 1 von 3' : currentStep === 'connection' ? 'Schritt 2 von 3' : 'Schritt 3 von 3';
  const stepTitle =
    currentStep === 'terms'
      ? 'Nutzungsbedingungen bestätigen'
      : currentStep === 'connection'
        ? 'Verbindung zur JTL-Wawi testen'
        : 'Einrichtung erfolgreich';
  const leadText =
    currentStep === 'terms'
      ? 'Bitte öffne die Nutzungsbedingungen in einem neuen Fenster und bestätige anschließend deine Zustimmung.'
      : currentStep === 'connection'
        ? 'Starte den Verbindungstest manuell, damit die App die Tenant-Anbindung prüfen kann.'
        : 'Die Tenant-Verbindung wurde erfolgreich vorbereitet und der Host wurde über den Abschluss informiert.';

  return (
    <main className="app-shell app-shell--setup">
      <section className="app-card app-card--setup page-stack" aria-labelledby="setup-title">
        <header className="setup-header">
          <p className="eyebrow">Setup</p>
          <div className="setup-step-meta" aria-label={stepLabel}>
            <span>{stepLabel}</span>
            <span>{currentStep === 'terms' ? 'Zustimmung' : currentStep === 'connection' ? 'Verbindungstest' : 'Abschluss'}</span>
          </div>
          <h1 id="setup-title">{stepTitle}</h1>
        </header>
        <p className="setup-lead">{leadText}</p>
        {currentStep === 'terms' ? (
          <>
            <div className="setup-checklist">
              <a className="setup-link" href="/terms-of-use" target="_blank" rel="noreferrer noopener">
                Nutzungsbedingungen in neuem Fenster öffnen
              </a>
              <div className="setup-checkbox">
                <input
                  id="terms-consent"
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={event => {
                    setHasAcceptedTerms(event.target.checked);
                  }}
                />
                <label htmlFor="terms-consent">Ich habe die Nutzungsbedingungen gelesen und stimme ihnen zu.</label>
              </div>
            </div>
            <p className="setup-status status-text" aria-live="polite">
              Ohne aktive Zustimmung ist kein Wechsel in den Verbindungstest möglich.
            </p>
            <div className="setup-actions">
              <Button onClick={handleOpenConnectionStep} label="Weiter" disabled={!hasAcceptedTerms} />
            </div>
          </>
        ) : null}
        {currentStep === 'connection' ? (
          <>
            <p
              className="setup-status status-text"
              data-status={connectionState === 'error' ? 'error' : connectionState === 'success' ? 'success' : undefined}
              aria-live={connectionState === 'idle' ? undefined : 'polite'}
              role={connectionState === 'error' ? 'alert' : undefined}
            >
              {connectionMessage ?? 'Der Test wird erst nach deinem Klick gestartet.'}
            </p>
            <div className="setup-actions">
              <Button
                onClick={() => {
                  void handleConnectionTest();
                }}
                label={connectionState === 'submitting' ? 'Verbindung wird geprüft…' : 'Verbindung testen'}
                disabled={isBusy}
              />
            </div>
          </>
        ) : null}
        {currentStep === 'success' ? (
          <>
            <p
              className="setup-status status-text"
              data-status={completionState === 'error' ? 'error' : 'success'}
              aria-live="polite"
              role={completionState === 'error' ? 'alert' : undefined}
            >
              {completionState === 'error'
                ? completionMessage
                : completionState === 'submitting'
                  ? 'Der Host wird über den erfolgreichen Abschluss informiert.'
                  : connectionMessage}
            </p>
            {completionMessage && completionState !== 'submitting' ? <p className="setup-lead">{completionMessage}</p> : null}
            {showManualCloseHint ? (
              <p className="setup-lead">Du kannst dieses Fenster jetzt manuell schließen und zur Host-Anwendung zurückkehren.</p>
            ) : null}
            <div className="setup-actions">
              <Button onClick={handleShowManualCloseHint} label="Fertig" disabled={completionState === 'submitting'} />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

export default SetupPage;
