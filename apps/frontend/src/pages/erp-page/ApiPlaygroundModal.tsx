import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@jtl-software/platform-ui-react';
import { useCallback, useState } from 'react';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { toAppError } from '../../services/appError';
import { useAppErrors } from '../../services/appErrorContext';
import { requestPlaygroundRequest, type PlaygroundRequestMethod, type PlaygroundRequestResult } from '../../services/erpService';

type ApiPlaygroundModalProps = {
  onClose: () => void;
};

function ApiPlaygroundModal({ onClose }: ApiPlaygroundModalProps) {
  const appBridgeClient = useAppBridgeClient();
  const { reportError } = useAppErrors();
  const [playgroundMethod, setPlaygroundMethod] = useState<PlaygroundRequestMethod>('GET');
  const [playgroundRoute, setPlaygroundRoute] = useState('/v1/worker');
  const [isRequesting, setIsRequesting] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<PlaygroundRequestResult | null>(null);
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);

  const handlePlaygroundRequest = useCallback(async (): Promise<void> => {
    try {
      setIsRequesting(true);
      setPlaygroundError(null);
      const nextResult = await requestPlaygroundRequest(appBridgeClient, { route: playgroundRoute, method: playgroundMethod });

      if (nextResult.error) {
        reportError(nextResult.error);
        setPlaygroundError(nextResult.error.details.userMessage);
      }

      setPlaygroundResult(nextResult);
    } catch (error) {
      const appError = toAppError(error, {
        source: 'erp',
        requestPath: `/erp${playgroundRoute}`,
        fallbackMessage: 'The playground request could not be completed.',
      });
      setPlaygroundResult(null);
      setPlaygroundError(appError.details.userMessage);
      reportError(appError);
    } finally {
      setIsRequesting(false);
    }
  }, [appBridgeClient, playgroundMethod, playgroundRoute, reportError]);

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="api-playground-title">
      <div className="app-modal-panel">
        <div className="app-modal-header">
          <div className="app-section-grid">
            <h2 id="api-playground-title" className="app-modal-title">
              API Playground
            </h2>
            <p className="app-muted-text">Run manual requests against the ERP proxy and inspect status, duration, and response data.</p>
          </div>
          <Button type="button" variant="outline" label="Close Playground" onClick={onClose} />
        </div>
        <div className="app-modal-body">
          <div className="app-section-grid app-modal-body__content">
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
              <Button type="submit" label={isRequesting ? 'Sending...' : 'Send request'} disabled={isRequesting} />
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
        </div>
      </div>
    </div>
  );
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

export default ApiPlaygroundModal;
