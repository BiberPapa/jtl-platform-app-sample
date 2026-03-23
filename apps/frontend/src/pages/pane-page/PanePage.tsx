import { Alert, Button, Card, CardContent, Input } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
import { AppPageShell } from '../../components';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { toAppError } from '../../services/appError';
import { useAppErrors } from '../../services/appErrorContext';

type PaneStatus = {
  title: string;
  variant: 'success' | 'destructive';
};

function PanePage() {
  const [customer, setCustomer] = useState('');
  const [status, setStatus] = useState<PaneStatus | null>(null);
  const appBridgeClient = useAppBridgeClient();
  const { reportError } = useAppErrors();

  useEffect(() => {
    try {
      const unsubscribe = appBridgeClient.subscribeToCustomerChanged(event => {
        setCustomer(event.customerId);
        setStatus({
          title: 'Customer was updated from the event stream.',
          variant: 'success',
        });
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      const appError = toAppError(error, {
        source: 'bridge',
        fallbackMessage: 'The customer change subscription could not be initialized.',
      });
      setStatus({
        title: appError.details.userMessage,
        variant: 'destructive',
      });
      reportError(appError);
    }

    return undefined;
  }, [appBridgeClient, reportError]);

  const handleGetCurrentCustomer = useCallback(async (): Promise<void> => {
    try {
      const customerId = await appBridgeClient.getCurrentCustomerId();
      setCustomer(customerId);
      setStatus({
        title: 'Customer was loaded on demand.',
        variant: 'success',
      });
    } catch (error) {
      const appError = toAppError(error, {
        source: 'bridge',
        fallbackMessage: 'The current customer could not be loaded.',
      });
      setStatus({
        title: appError.details.userMessage,
        variant: 'destructive',
      });
      reportError(appError);
    }
  }, [appBridgeClient, reportError]);

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
          {status ? <Alert title={status.title} variant={status.variant} closable={false} /> : null}
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
