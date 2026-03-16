import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { Button, Input, Stack, Text } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
import { createAppBridgeClient } from '../../services/appBridgeClient';
import { getCurrentCustomerId } from '../../services/paneService';

type PanePageProps = {
  appBridge: AppBridge;
};

function PanePage({ appBridge }: PanePageProps) {
  const [customer, setCustomer] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = createAppBridgeClient(appBridge).subscribeToCustomerChanged(event => {
      try {
        setCustomer(event.customerId);
        setStatusMessage('Customer was updated from the event stream.');
      } catch {
        setStatusMessage('The bridge emitted an unexpected CustomerChanged payload.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [appBridge]);

  const handleGetCurrentCustomer = useCallback(async (): Promise<void> => {
    try {
      const customerId = await getCurrentCustomerId(createAppBridgeClient(appBridge));
      setCustomer(customerId);
      setStatusMessage('Customer was loaded on demand.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The current customer could not be loaded.';
      setStatusMessage(message);
    }
  }, [appBridge]);

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
