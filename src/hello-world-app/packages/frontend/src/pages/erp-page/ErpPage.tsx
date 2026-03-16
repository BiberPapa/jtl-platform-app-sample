import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { useCallback, useState } from 'react';
import { requestCurrentTime } from '../../services/erpService';

type ErpPageProps = {
  appBridge: AppBridge;
};

function ErpPage({ appBridge }: ErpPageProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const view = new URLSearchParams(window.location.search).get('view') ?? 'default';

  const handleRequestTimestampPress = useCallback(async (): Promise<void> => {
    try {
      setIsRequesting(true);
      setErrorMessage(null);
      const currentTime = await requestCurrentTime(appBridge);
      setTime(currentTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The current time could not be loaded.';
      setErrorMessage(message);
    } finally {
      setIsRequesting(false);
    }
  }, [appBridge]);

  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="erp-title">
        <p className="eyebrow">ERP</p>
        <h1 id="erp-title">{`ERP view: ${view}`}</h1>
        <p>This page demonstrates a typed bridge method roundtrip and keeps the asynchronous state explicit.</p>
        <button
          type="button"
          onClick={() => {
            void handleRequestTimestampPress();
          }}
        >
          Request time now
        </button>
        {isRequesting ? (
          <p className="status-text" aria-live="polite">
            Requesting the current time from the bridge...
          </p>
        ) : null}
        {errorMessage ? (
          <p className="status-text" data-status="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {time ? <p className="value-box">{time}</p> : null}
      </section>
    </main>
  );
}

export default ErpPage;
