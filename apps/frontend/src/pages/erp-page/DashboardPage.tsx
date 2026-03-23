import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useState } from 'react';
import { AppPageShell } from '../../components';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { toAppError } from '../../services/appError';
import { useAppErrors } from '../../services/appErrorContext';
import { requestAuthorizationStatus, requestErpInfoStatus, type AuthorizationStatus, type ErpInfoStatus } from '../../services/erpService';
import { getGlobalTenantIdFromSessionToken } from '../../services/sessionTokenTenant';
import ApiExplorerModal, { type ApiExplorerMode } from './ApiExplorerModal';
import ApiPlaygroundModal from './ApiPlaygroundModal';
import TimingBreakdownCard from './TimingBreakdownCard';

type DashboardState = {
  erpInfo: ErpInfoStatus;
  authorization: AuthorizationStatus;
  globalTenantId: string | null;
};

function DashboardPage() {
  const appBridgeClient = useAppBridgeClient();
  const { reportError } = useAppErrors();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<DashboardState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ApiExplorerMode | 'playground' | null>(null);

  const loadStatus = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [erpInfo, authorization, globalTenantId] = await Promise.all([
        requestErpInfoStatus(appBridgeClient),
        requestAuthorizationStatus(appBridgeClient),
        getGlobalTenantIdFromSessionToken(appBridgeClient),
      ]);
      if (erpInfo.error) {
        reportError(erpInfo.error);
      }
      if (authorization.error) {
        reportError(authorization.error);
      }
      setStatus({ erpInfo, authorization, globalTenantId });
    } catch (error) {
      const appError = toAppError(error, {
        source: 'erp',
        fallbackMessage: 'The dashboard status could not be loaded.',
      });
      setStatus(null);
      setErrorMessage(appError.details.userMessage);
      reportError(appError);
    } finally {
      setIsLoading(false);
    }
  }, [appBridgeClient, reportError]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const openApiExplorer = useCallback((mode: ApiExplorerMode) => {
    setActiveModal(mode);
  }, []);

  return (
    <AppPageShell
      eyebrow="ERP"
      title="Dashboard"
      lead="Overview of API availability, authorization, and response times for the demo app."
      actions={
        <Button
          type="button"
          variant="outline"
          size="icon"
          icon="RefreshCw"
          aria-label="Refresh dashboard"
          isLoading={isLoading}
          onClick={() => void loadStatus()}
          disabled={isLoading}
        />
      }
      width="wide"
    >
      <div className="app-section-grid" aria-live="polite">
        {isLoading ? <Alert title="Loading dashboard status..." variant="info" closable={false} /> : null}
        {errorMessage ? (
          <Alert title="Dashboard status could not be loaded" description={errorMessage} variant="destructive" closable={false} />
        ) : null}
      </div>
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
                <p className="app-metric-value">Local: {status?.erpInfo.tenantId ?? (isLoading ? 'Loading...' : 'No tenant information')}</p>
                <p className="app-muted-text">Global: {status?.globalTenantId ?? (isLoading ? 'Loading...' : 'No tenant information')}</p>
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
          <div className="app-section-grid">
            <div className="app-section-grid">
              <CardTitle>API playground</CardTitle>
              <p className="app-muted-text">Open an explorer or run a manual request against the ERP proxy in a popup window.</p>
            </div>
            <div className="app-button-row">
              <Button type="button" variant="outline" label="REST API Explorer" onClick={() => openApiExplorer('rest')} />
              <Button type="button" variant="outline" label="GraphQL Explorer" onClick={() => openApiExplorer('graphql')} />
              <Button type="button" variant="outline" label="API Playground" onClick={() => setActiveModal('playground')} />
            </div>
          </div>
        </CardContent>
      </Card>
      {activeModal === 'graphql' || activeModal === 'rest' ? <ApiExplorerModal mode={activeModal} onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'playground' ? <ApiPlaygroundModal onClose={() => setActiveModal(null)} /> : null}
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

export default DashboardPage;
