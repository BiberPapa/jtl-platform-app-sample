import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { requestErpInfoStatus, runApiTests, type ApiTestResult, type ErpInfoStatus } from '../../services/erpService';
import HelloWorldErpPage from './HelloWorldErpPage';

function ApiTestPage() {
  const appBridgeClient = useAppBridgeClient();
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overview, setOverview] = useState<ErpInfoStatus | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);

  const successRate = useMemo(() => {
    if (testResults.length === 0) {
      return 0;
    }

    const successfulResults = testResults.filter((result) => result.state === 'success').length;

    return Math.round((successfulResults / testResults.length) * 100);
  }, [testResults]);

  const loadOverview = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingOverview(true);
      setOverviewError(null);
      setOverview(await requestErpInfoStatus(appBridgeClient));
    } catch (error) {
      setOverview(null);
      setOverviewError(error instanceof Error ? error.message : 'The API overview could not be loaded.');
    } finally {
      setIsLoadingOverview(false);
    }
  }, [appBridgeClient]);

  const handleStartTests = useCallback(async (): Promise<void> => {
    try {
      setIsRunningTests(true);
      setTestResults(await runApiTests(appBridgeClient));
    } finally {
      setIsRunningTests(false);
    }
  }, [appBridgeClient]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  return (
    <HelloWorldErpPage
      eyebrow="ERP Menu"
      title="JTL-Wawi API Status"
      description="API overview and endpoint health checks for the JTL-Wawi ERP routes."
      cardClassName="app-card--dashboard"
      content={
        <>
          <section className="dashboard-hero" aria-labelledby="api-test-overview-title">
            <div className="dashboard-hero-copy">
              <p className="dashboard-kicker">API health</p>
              <h2 id="api-test-overview-title">API-Overview</h2>
              <p className="dashboard-hero-text">Inspect the ERP v2 API generation and run route checks sequentially against the proxy.</p>
            </div>
            <div className="dashboard-actions">
              <button
                type="button"
                onClick={() => {
                  void loadOverview();
                }}
                disabled={isLoadingOverview}
              >
                {isLoadingOverview ? 'Refreshing...' : 'Overview refresh'}
              </button>
            </div>
          </section>
          {isLoadingOverview ? (
            <p className="status-text" aria-live="polite">
              Loading API overview...
            </p>
          ) : null}
          {overviewError ? (
            <p className="status-text" data-status="error" role="alert">
              {overviewError}
            </p>
          ) : null}
          <section className="dashboard-summary" aria-labelledby="api-test-summary-title">
            <h2 id="api-test-summary-title">API-Overview</h2>
            <div className="dashboard-metrics">
              <article className="dashboard-metric">
                <span className="dashboard-metric-label">Tenant Id</span>
                <strong className="dashboard-metric-value">{overview?.tenantId ?? (isLoadingOverview ? 'Loading...' : 'No tenant information')}</strong>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric-label">API Version</span>
                <strong className="dashboard-metric-value">{overview?.version ?? (isLoadingOverview ? 'Loading...' : 'Unavailable')}</strong>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric-label">Total time</span>
                <strong className="dashboard-metric-value">{formatDuration(overview?.totalTimeMs ?? null, isLoadingOverview)}</strong>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric-label">Infrastructure time</span>
                <strong className="dashboard-metric-value">{formatDuration(overview?.infrastructureTimeMs ?? null, isLoadingOverview)}</strong>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric-label">ERP time</span>
                <strong className="dashboard-metric-value">{formatDuration(overview?.erpTimeMs ?? null, isLoadingOverview)}</strong>
              </article>
            </div>
          </section>
          <section className="dashboard-status-card api-test-section" aria-labelledby="api-test-routes-title">
            <div className="dashboard-status-header">
              <h2 id="api-test-routes-title">Routen</h2>
              <button
                type="button"
                className="api-test-run-button"
                onClick={() => {
                  void handleStartTests();
                }}
                disabled={isRunningTests}
              >
                {isRunningTests ? 'Tests laufen...' : 'Test starten'}
              </button>
            </div>
            <div className="api-test-table-wrapper">
              <table className="api-test-table">
                <thead>
                  <tr>
                    <th scope="col">Route</th>
                    <th scope="col">HTTP-Status</th>
                    <th scope="col">Ergebnis</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="api-test-empty">
                        Noch keine Ergebnisse. Starte den Testlauf, um alle Endpunkte nacheinander zu pruefen.
                      </td>
                    </tr>
                  ) : (
                    testResults.map((result) => (
                      <tr key={result.route}>
                        <td>{result.route}</td>
                        <td>{result.statusCode}</td>
                        <td>
                          <span className="dashboard-badge" data-status={result.state === 'success' ? 'success' : 'error'}>
                            {result.state === 'success' ? 'OK' : 'Fehler'}
                          </span>
                        </td>
                        <td>{result.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="api-test-progress">
              <div className="api-test-progress-header">
                <h3>Statusanzeige</h3>
                <strong>{successRate}% erfolgreich</strong>
              </div>
              <div className="api-test-progress-bar" aria-hidden="true">
                <div className="api-test-progress-fill" style={{ width: `${successRate}%` }} />
              </div>
            </div>
          </section>
        </>
      }
    />
  );
}

function formatDuration(durationMs: number | null, isLoading: boolean): string {
  if (isLoading) {
    return 'Loading...';
  }

  if (durationMs == null) {
    return 'Unavailable';
  }

  return `${durationMs} ms`;
}

export default ApiTestPage;
