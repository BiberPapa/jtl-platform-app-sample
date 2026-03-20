import { Alert, Button, Card, CardContent, Input } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
import { AppPageShell } from '../../components';
import { useAppBridgeClient } from '../../services/appBridgeContext';

function PanePage() {
  const [customer, setCustomer] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const appBridgeClient = useAppBridgeClient();

  useEffect(() => {
    const unsubscribe = appBridgeClient.subscribeToCustomerChanged(event => {
      setCustomer(event.customerId);
      setStatusMessage('Customer was updated from the event stream.');
    });

    return () => {
      unsubscribe();
    };
  }, [appBridgeClient]);

  const handleGetCurrentCustomer = useCallback(async (): Promise<void> => {
    try {
      const customerId = await appBridgeClient.getCurrentCustomerId();
      setCustomer(customerId);
      setStatusMessage('Customer was loaded on demand.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The current customer could not be loaded.';
      setStatusMessage(message);
    }
  }, [appBridgeClient]);

  return (
    <AppPageShell
      eyebrow="Pane"
      title="Customer context"
      lead="The pane listens to bridge events and can also request the current customer explicitly."
      width="compact"
    >
      <Card>
        <CardContent className="app-section-grid">
          <Input aria-label="Current customer" disabled value={customer} />
          {statusMessage ? (
            <Alert title={statusMessage} variant={statusMessage.includes('could not') ? 'destructive' : 'success'} closable={false} />
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              void handleGetCurrentCustomer();
            }}
            label="Get Current Customer"
          />
        </CardContent>
      </Card>
    </AppPageShell>
  );
}

export default PanePage;
