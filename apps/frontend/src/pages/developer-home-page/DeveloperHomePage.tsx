import { Alert, Card, CardContent, CardHeader, CardTitle } from '@jtl-software/platform-ui-react';
import { useEffect, useState } from 'react';
import { AppPageShell } from '../../components';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { requestAppInfo, type AppInfoResponse } from '../../services/appInfoService';

function DeveloperHomePage() {
  const appBridgeClient = useAppBridgeClient();
  const [isLoading, setIsLoading] = useState(true);
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const nextAppInfo = await requestAppInfo(appBridgeClient);

        if (isMounted) {
          setAppInfo(nextAppInfo);
        }
      } catch (error) {
        if (isMounted) {
          setAppInfo(null);
          setErrorMessage(error instanceof Error ? error.message : 'The backend app info could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [appBridgeClient]);

  return (
    <AppPageShell
      eyebrow="Developer"
      title="Developer Start Page"
      lead="Use this entry point during local development to understand the main host modes and quickly jump into the hub or Cloud ERP."
    >
      <div className="app-section-grid">
        {isLoading ? <Alert title="Loading developer app info..." variant="info" closable={false} /> : null}
        {errorMessage ? (
          <Alert title="Developer app info could not be loaded" description={errorMessage} variant="destructive" closable={false} />
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Host Modes</CardTitle>
          </CardHeader>
          <CardContent className="app-section-grid">
            <p className="app-muted-text">
              Hub mode opens the app from the JTL Hub and provides the normal host context. For manual development and debugging outside the hub, you
              can use the local entry points and optionally configure NOHUB mode.
            </p>
            <p className="app-muted-text">
              Open <a href={appInfo?.hubUrl ?? '#'}>JTL Hub</a> or <a href={appInfo?.cloudErpUrl ?? '#'}>Cloud ERP</a>.
            </p>
          </CardContent>
        </Card>
        <div className="app-metric-grid">
          <Card className="app-metric-card">
            <CardContent>
              <p className="app-metric-label">Environment</p>
              <p className="app-metric-value">{appInfo?.environment ?? (isLoading ? 'Loading...' : 'Unavailable')}</p>
            </CardContent>
          </Card>
          <Card className="app-metric-card">
            <CardContent>
              <p className="app-metric-label">NOHUB mode</p>
              <p className="app-metric-value">
                {appInfo ? (appInfo.isNohubConfigured ? 'Configured' : 'Not configured') : isLoading ? 'Loading...' : 'Unavailable'}
              </p>
              <p className="app-muted-text">Tenant ID: {appInfo?.nohubTenantId ?? (isLoading ? 'Loading...' : 'Not configured')}</p>
            </CardContent>
          </Card>
          <Card className="app-metric-card">
            <CardContent>
              <p className="app-metric-label">API Base URL</p>
              <p className="app-metric-value">{appInfo?.apiBaseUrl ?? (isLoading ? 'Loading...' : 'Unavailable')}</p>
            </CardContent>
          </Card>
          <Card className="app-metric-card">
            <CardContent>
              <p className="app-metric-label">Auth URL</p>
              <p className="app-metric-value">{appInfo?.authUrl ?? (isLoading ? 'Loading...' : 'Unavailable')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppPageShell>
  );
}

export default DeveloperHomePage;
