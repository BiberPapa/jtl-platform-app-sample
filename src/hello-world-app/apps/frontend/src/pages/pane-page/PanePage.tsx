import { Button, Input, Stack, Text } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { getCurrentCustomerId } from '../../services/paneService';

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
      const customerId = await getCurrentCustomerId(appBridgeClient);
      setCustomer(customerId);
      setStatusMessage('Customer was loaded on demand.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The current customer could not be loaded.';
      setStatusMessage(message);
    }
  }, [appBridgeClient]);

  return (
    <main className="app-shell">
      <section className="app-card">
        <Stack spacing="4" direction="column">
          <p className="eyebrow">Pane</p>
          <Text align="center" type="h2">
            Customer context
          </Text>
          <Text align="center">The pane listens to bridge events and can also request the current customer explicitly.</Text>
          <Input aria-label="Current customer" disabled value={customer} />
          {statusMessage ? (
            <p className="status-text" data-status={statusMessage.includes('could not') ? 'error' : 'success'}>
              {statusMessage}
            </p>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              void handleGetCurrentCustomer();
            }}
            label="Get Current Customer"
          />
        </Stack>
      </section>
    </main>
  );
}

export default PanePage;
