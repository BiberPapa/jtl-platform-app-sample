import { useCallback, useState } from 'react';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { requestCustomers } from '../../services/erpService';

function ErpHomePage() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [customerData, setCustomerData] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const appBridgeClient = useAppBridgeClient();

  const handleRequestCustomersPress = useCallback(async (): Promise<void> => {
    try {
      setIsRequesting(true);
      setErrorMessage(null);
      const customers = await requestCustomers(appBridgeClient);
      setCustomerData(JSON.stringify(customers, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The customer data could not be loaded.';
      setErrorMessage(message);
    } finally {
      setIsRequesting(false);
    }
  }, [appBridgeClient]);

  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="erp-title">
        <p className="eyebrow">ERP</p>
        <h1 id="erp-title">ERP view: default</h1>
        <p>This page validates the current session in the backend and then loads customer data through the ERP tunnel.</p>
        <button
          type="button"
          onClick={() => {
            void handleRequestCustomersPress();
          }}
        >
          Load customer data
        </button>
        {isRequesting ? (
          <p className="status-text" aria-live="polite">
            Loading customer data from the backend ERP tunnel...
          </p>
        ) : null}
        {errorMessage ? (
          <p className="status-text" data-status="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {customerData ? <pre className="value-box">{customerData}</pre> : null}
      </section>
    </main>
  );
}

export default ErpHomePage;
