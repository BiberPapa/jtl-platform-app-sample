import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './restExplorerPanel.css';
import { buildBackendUrl } from '../../services/apiClient';
import { useAppBridgeClient } from '../../services/appBridgeContext';

type SwaggerRequest = {
  headers?: Record<string, string>;
  [key: string]: unknown;
};

type SwaggerParameter = {
  get: (key: string) => unknown;
};

const SwaggerUIWithExtendedProps = SwaggerUI as unknown as (props: {
  url: string;
  parameterMacro?: (operation: unknown, parameter: SwaggerParameter) => string | undefined;
  requestInterceptor?: (request: SwaggerRequest) => SwaggerRequest;
}) => ReactElement;

function RestExplorerPanel() {
  const appBridgeClient = useAppBridgeClient();
  const [sessionToken, setSessionToken] = useState('');

  useEffect(() => {
    let isActive = true;

    void appBridgeClient
      .getSessionToken()
      .then(token => {
        if (isActive) {
          setSessionToken(token);
        }
      })
      .catch(() => {
        if (isActive) {
          setSessionToken('');
        }
      });

    return () => {
      isActive = false;
    };
  }, [appBridgeClient]);

  return (
    <div className="rest-explorer-panel">
      <SwaggerUIWithExtendedProps
        key={sessionToken || 'no-session-token'}
        url={buildBackendUrl('/openapi.json')}
        parameterMacro={(_operation: unknown, parameter: SwaggerParameter) => {
          if (parameter.get('in') === 'header' && parameter.get('name') === 'X-Session-Token') {
            return sessionToken;
          }

          return undefined;
        }}
        requestInterceptor={(request: SwaggerRequest) => {
          if (sessionToken) {
            request['headers'] = {
              ...(request['headers'] ?? {}),
              'X-Session-Token': sessionToken,
            };
          }

          return request;
        }}
      />
    </div>
  );
}

export default RestExplorerPanel;
