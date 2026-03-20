import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
import { AppPageShell } from '../../components';
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
import ApiExplorerModal from './ApiExplorerModal';
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
  const [isApiExplorerOpen, setIsApiExplorerOpen] = useState(false);

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
    <AppPageShell
      eyebrow="ERP"
      title="Dashboard"
      lead="Overview of API availability, authorization, and response times for the demo app."
      actions={
        <Button
          type="button"
          variant="outline"
          label={isLoading ? 'Refreshing dashboard' : 'Refresh dashboard'}
          onClick={() => {
            void loadStatus();
          }}
          disabled={isLoading}
        />
      }
      width="wide"
    >
      {isLoading ? <Alert title="Loading dashboard status..." variant="info" closable={false} /> : null}
      {errorMessage ? <Alert title="Dashboard status could not be loaded" description={errorMessage} variant="destructive" closable={false} /> : null}
      <Card>
        <CardHeader>
          <div className="app-section-header">
            <div className="app-section-grid">
              <CardTitle>API status</CardTitle>
              <p className="app-muted-text">Key ERP and authorization details at a glance.</p>
            </div>
            <div className="app-badge-row">
              <Badge
                label={getApiStatusLabel(status?.erpInfo ?? null, isLoading)}
                variant={getStatusBadgeVariant(getApiStatusBadge(status?.erpInfo ?? null, isLoading))}
              />
              <Badge
                label={getAuthorizationLabel(status?.authorization ?? null, isLoading)}
                variant={getStatusBadgeVariant(getAuthorizationBadge(status?.authorization ?? null, isLoading))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="app-section-grid">
          <div className="app-metric-grid">
            <Card className="app-metric-card">
              <CardContent>
                <p className="app-metric-label">Tenant Id</p>
                <p className="app-metric-value">{status?.erpInfo.tenantId ?? (isLoading ? 'Loading...' : 'No tenant information')}</p>
              </CardContent>
            </Card>
            <Card className="app-metric-card">
              <CardContent>
                <p className="app-metric-label">API version</p>
                <p className="app-metric-value">{status?.erpInfo.version ?? (isLoading ? 'Loading...' : 'Unavailable')}</p>
              </CardContent>
            </Card>
            <TimingBreakdownCard
              totalTimeMs={status?.erpInfo.totalTimeMs ?? null}
              infrastructureTimeMs={status?.erpInfo.infrastructureTimeMs ?? null}
              erpTimeMs={status?.erpInfo.erpTimeMs ?? null}
              frontendTimeMs={status?.erpInfo.frontendTimeMs ?? null}
              isLoading={isLoading}
            />
          </div>
          {status?.erpInfo.errorMessage ? <Alert title={status.erpInfo.errorMessage} variant="destructive" closable={false} /> : null}
          {status?.authorization.message ? (
            <Alert
              title={status.authorization.message}
              variant={
                status.authorization.state === 'authorized' ? 'success' : status.authorization.state === 'unauthorized' ? 'warning' : 'destructive'
              }
              closable={false}
            />
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="app-section-header">
            <div className="app-section-grid">
              <CardTitle>API playground</CardTitle>
              <p className="app-muted-text">Run manual requests against the ERP proxy and inspect status, duration, and response data.</p>
            </div>
            <div className="app-button-row">
              <Button type="button" variant="outline" label="API Explorer" onClick={() => setIsApiExplorerOpen(true)} />
              <Button
                type="button"
                variant="outline"
                label={isPlaygroundOpen ? 'Hide playground' : 'Show playground'}
                aria-expanded={isPlaygroundOpen}
                aria-controls="dashboard-playground-panel"
                onClick={() => {
                  setIsPlaygroundOpen(currentValue => !currentValue);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="app-section-grid">
          {!isPlaygroundOpen ? <p className="app-muted-text">Open the playground to send a manual request.</p> : null}
          {isPlaygroundOpen ? (
            <div id="dashboard-playground-panel" className="app-section-grid">
              <form
                className="app-form-grid app-form-grid--playground"
                onSubmit={event => {
                  event.preventDefault();
                  void handlePlaygroundRequest();
                }}
              >
                <Select
                  label="Method"
                  value={playgroundMethod}
                  onChange={(value: string) => setPlaygroundMethod(value as PlaygroundRequestMethod)}
                  options={[
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                    { value: 'PUT', label: 'PUT' },
                    { value: 'DELETE', label: 'DELETE' },
                    { value: 'HEAD', label: 'HEAD' },
                  ]}
                />
                <Input label="Route" value={playgroundRoute} onChange={(value: string) => setPlaygroundRoute(value)} placeholder="/v1/worker" />
                <Button type="submit" label={isPlaygroundRequesting ? 'Sending...' : 'Send request'} disabled={isPlaygroundRequesting} />
              </form>
              {playgroundError ? <Alert title={playgroundError} variant="destructive" closable={false} /> : null}
              {playgroundResult ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Response details</CardTitle>
                  </CardHeader>
                  <CardContent className="app-section-grid">
                    <div className="app-section-grid app-section-grid--two">
                      <div>
                        <p className="app-inline-label">Response status:</p>
                        <p className="app-metric-value">{playgroundResult.status}</p>
                      </div>
                      <div>
                        <p className="app-inline-label">Response time:</p>
                        <p className="app-metric-value">{playgroundResult.responseTimeMs} ms</p>
                      </div>
                    </div>
                    <p className="app-muted-text">
                      Request: <strong>{playgroundResult.method}</strong> <strong>{playgroundResult.route}</strong>
                    </p>
                    <pre className="app-code-block">{formatPlaygroundBody(playgroundResult.body)}</pre>
                  </CardContent>
                </Card>
              ) : (
                <p className="app-muted-text">Enter a route and send a request to inspect the ERP response payload here.</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
      {isApiExplorerOpen ? <ApiExplorerModal onClose={() => setIsApiExplorerOpen(false)} /> : null}
    </AppPageShell>
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

function getStatusBadgeVariant(status: 'loading' | 'success' | 'error'): 'default' | 'success' | 'destructive' {
  if (status === 'success') {
    return 'success';
  }

  if (status === 'error') {
    return 'destructive';
  }

  return 'default';
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
