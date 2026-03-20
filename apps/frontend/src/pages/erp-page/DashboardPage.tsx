import { useCallback, useEffect, useState } from 'react';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import {
  requestAuthorizationStatus,
  requestErpInfoStatus,
  requestPlaygroundRequest,
  type AuthorizationStatus,
  type ErpInfoStatus,
  type PlaygroundRequestMethod,
  type PlaygroundRequestResult,
} from '../../services/erpService';
import HelloWorldErpPage from './HelloWorldErpPage';
import TimingBreakdownCard from './TimingBreakdownCard';

type DashboardState = {
  erpInfo: ErpInfoStatus;
  authorization: AuthorizationStatus;
};

function DashboardPage() {
  const appBridgeClient = useAppBridgeClient();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<DashboardState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [playgroundMethod, setPlaygroundMethod] = useState<PlaygroundRequestMethod>('GET');
  const [playgroundRoute, setPlaygroundRoute] = useState('/v1/worker');
  const [isPlaygroundRequesting, setIsPlaygroundRequesting] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<PlaygroundRequestResult | null>(null);
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);

  const loadStatus = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [erpInfo, authorization] = await Promise.all([requestErpInfoStatus(appBridgeClient), requestAuthorizationStatus(appBridgeClient)]);
      setStatus({ erpInfo, authorization });
    } catch (error) {
      setStatus(null);
      setErrorMessage(error instanceof Error ? error.message : 'The dashboard status could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [appBridgeClient]);

  const handlePlaygroundRequest = useCallback(async (): Promise<void> => {
    try {
      setIsPlaygroundRequesting(true);
      setPlaygroundError(null);
      setPlaygroundResult(await requestPlaygroundRequest(appBridgeClient, { route: playgroundRoute, method: playgroundMethod }));
    } catch (error) {
      setPlaygroundResult(null);
      setPlaygroundError(error instanceof Error ? error.message : 'The playground request could not be completed.');
    } finally {
      setIsPlaygroundRequesting(false);
    }
  }, [appBridgeClient, playgroundMethod, playgroundRoute]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <HelloWorldErpPage
      eyebrow=""
      cardClassName="app-card--dashboard"
      content={
        <>
          <section className="dashboard-hero" aria-labelledby="dashboard-overview-title">
            <div className="dashboard-hero-copy">
              <p className="dashboard-kicker" id="dashboard-overview-title">
                Dashboard
              </p>
            </div>
            <div className="dashboard-actions">
              <button
                type="button"
                className="dashboard-refresh-button"
                aria-label={isLoading ? 'Refreshing dashboard' : 'Refresh dashboard'}
                onClick={() => {
                  void loadStatus();
                }}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M20 12a8 8 0 1 1-2.34-5.66"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M20 4v4h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </section>
          {isLoading ? (
            <p className="status-text" aria-live="polite">
              Loading dashboard status...
            </p>
          ) : null}
          {errorMessage ? (
            <p className="status-text" data-status="error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <section className="dashboard-summary" aria-labelledby="dashboard-summary-title">
            <div className="dashboard-summary-header">
              <h2 id="dashboard-summary-title">API status</h2>
              <div className="dashboard-summary-badges">
                <span className="dashboard-badge" data-status={getApiStatusBadge(status?.erpInfo ?? null, isLoading)}>
                  {getApiStatusLabel(status?.erpInfo ?? null, isLoading)}
                </span>
                <span className="dashboard-badge" data-status={getAuthorizationBadge(status?.authorization ?? null, isLoading)}>
                  {getAuthorizationLabel(status?.authorization ?? null, isLoading)}
                </span>
              </div>
            </div>
            <div className="dashboard-metrics">
              <article className="dashboard-metric">
                <span className="dashboard-metric-label">Tenant Id</span>
                <strong className="dashboard-metric-value">{status?.erpInfo.tenantId ?? (isLoading ? 'Loading...' : 'No tenant information')}</strong>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric-label">API version</span>
                <strong className="dashboard-metric-value">{status?.erpInfo.version ?? (isLoading ? 'Loading...' : 'Unavailable')}</strong>
              </article>
              <TimingBreakdownCard
                totalTimeMs={status?.erpInfo.totalTimeMs ?? null}
                infrastructureTimeMs={status?.erpInfo.infrastructureTimeMs ?? null}
                erpTimeMs={status?.erpInfo.erpTimeMs ?? null}
                frontendTimeMs={status?.erpInfo.frontendTimeMs ?? null}
                isLoading={isLoading}
              />
            </div>
            <div className="dashboard-summary-details">
              {status?.erpInfo.errorMessage ? (
                <p className="status-text" data-status="error" role="status">
                  {status.erpInfo.errorMessage}
                </p>
              ) : null}
              {status?.authorization.message ? (
                <p className="status-text" data-status={getAuthorizationTextStatus(status.authorization)} role="status">
                  {status.authorization.message}
                </p>
              ) : null}
            </div>
          </section>
          <section className="dashboard-playground-shell" aria-labelledby="dashboard-playground-title">
            {isPlaygroundOpen ? (
              <div id="dashboard-playground-panel" className="dashboard-playground-panel">
                <div className="dashboard-playground-header">
                  <div>
                    <p className="dashboard-kicker">Manual request</p>
                    <h2 id="dashboard-playground-title">API playground</h2>
                  </div>
                  <span className="dashboard-playground-hint">Expands upward from the footer bar</span>
                </div>
                <form
                  className="dashboard-playground-form"
                  onSubmit={event => {
                    event.preventDefault();
                    void handlePlaygroundRequest();
                  }}
                >
                  <label className="dashboard-field">
                    <span className="dashboard-field-label">Method</span>
                    <select value={playgroundMethod} onChange={event => setPlaygroundMethod(event.target.value as PlaygroundRequestMethod)}>
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="HEAD">HEAD</option>
                    </select>
                  </label>
                  <label className="dashboard-field dashboard-field--route">
                    <span className="dashboard-field-label">Route</span>
                    <input type="text" value={playgroundRoute} onChange={event => setPlaygroundRoute(event.target.value)} placeholder="/v1/worker" />
                  </label>
                  <button type="submit" className="dashboard-playground-submit" disabled={isPlaygroundRequesting}>
                    {isPlaygroundRequesting ? 'Sending...' : 'Send request'}
                  </button>
                </form>
                {playgroundError ? (
                  <p className="status-text" data-status="error" role="alert">
                    {playgroundError}
                  </p>
                ) : null}
                {playgroundResult ? (
                  <div className="dashboard-playground-result">
                    <div className="dashboard-playground-meta">
                      <p>
                        Response status: <strong>{playgroundResult.status}</strong>
                      </p>
                      <p>
                        Response time: <strong>{playgroundResult.responseTimeMs} ms</strong>
                      </p>
                      <p>
                        Request: <strong>{playgroundResult.method}</strong> <strong>{playgroundResult.route}</strong>
                      </p>
                    </div>
                    <pre className="value-box">{formatPlaygroundBody(playgroundResult.body)}</pre>
                  </div>
                ) : (
                  <p className="dashboard-card-copy">Enter a route and send a request to inspect the ERP response payload here.</p>
                )}
              </div>
            ) : null}
            <button
              type="button"
              className="dashboard-playground-toggle"
              aria-expanded={isPlaygroundOpen}
              aria-controls="dashboard-playground-panel"
              onClick={() => {
                setIsPlaygroundOpen(currentValue => !currentValue);
              }}
            >
              {isPlaygroundOpen ? 'Hide playground' : 'Show playground'}
            </button>
          </section>
        </>
      }
    />
  );
}

function getApiStatusBadge(status: ErpInfoStatus | null, isLoading: boolean): 'loading' | 'success' | 'error' {
  if (isLoading) {
    return 'loading';
  }

  return status?.reachable ? 'success' : 'error';
}

function getApiStatusLabel(status: ErpInfoStatus | null, isLoading: boolean): string {
  if (isLoading) {
    return 'Loading';
  }

  return status?.reachable ? 'Reachable' : 'Unavailable';
}

function getAuthorizationBadge(status: AuthorizationStatus | null, isLoading: boolean): 'loading' | 'success' | 'error' {
  if (isLoading) {
    return 'loading';
  }

  return status?.state === 'authorized' ? 'success' : 'error';
}

function getAuthorizationLabel(status: AuthorizationStatus | null, isLoading: boolean): string {
  if (isLoading) {
    return 'Loading';
  }

  if (status?.state === 'authorized') {
    return 'Authorized';
  }

  if (status?.state === 'unauthorized') {
    return 'Not authorized';
  }

  return 'Check failed';
}

function getAuthorizationTextStatus(status: AuthorizationStatus): 'success' | 'error' {
  return status.state === 'authorized' ? 'success' : 'error';
}

function formatPlaygroundBody(body: unknown): string {
  if (body === null) {
    return 'Empty response body';
  }

  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body, null, 2);
}

export default DashboardPage;
