import { Alert, Button } from '@jtl-software/platform-ui-react';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import '@graphiql/plugin-explorer/style.css';
import { buildSchema, type GraphQLSchema } from 'graphql';
import { GraphiQL } from 'graphiql';
import 'graphiql/style.css';
import { useEffect, useMemo, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { toAppError } from '../../services/appError';
import { useAppErrors } from '../../services/appErrorContext';
import { buildBackendUrl } from '../../services/apiClient';
import { requestGraphQlOperation, requestGraphQlSchema } from '../../services/graphQlSchemaService';

type ApiExplorerModalProps = {
  mode: ApiExplorerMode;
  onClose: () => void;
};

export type ApiExplorerMode = 'graphql' | 'rest';

function ApiExplorerModal({ mode, onClose }: ApiExplorerModalProps) {
  const appBridgeClient = useAppBridgeClient();
  const { reportError } = useAppErrors();
  const [graphQlSchema, setGraphQlSchema] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isGraphQlMode = mode === 'graphql';
  const graphQlExplorerPlugin = useMemo(() => explorerPlugin(), []);
  const graphQlSchemaObject = useMemo<GraphQLSchema | null>(() => {
    if (!graphQlSchema) {
      return null;
    }

    try {
      return buildSchema(graphQlSchema);
    } catch {
      return null;
    }
  }, [graphQlSchema]);

  useEffect(() => {
    if (!isGraphQlMode) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setErrorMessage(null);
        setGraphQlSchema(await requestGraphQlSchema(appBridgeClient));
      } catch (error) {
        if (isMounted) {
          const appError = toAppError(error, {
            source: 'graphql',
            requestPath: '/graphql/schema.graphql',
            fallbackMessage: 'The GraphQL schema could not be loaded.',
          });
          setGraphQlSchema(null);
          setErrorMessage(appError.details.userMessage);
          reportError(appError);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [appBridgeClient, isGraphQlMode, reportError]);

  const graphQlFetcher = useMemo(
    () =>
      async (graphQlParams: {
        query?: string;
        variables?: string | Record<string, unknown> | null;
        operationName?: string | null;
      }): Promise<unknown> => {
        const query = graphQlParams.query?.trim() ?? '';

        if (!query) {
          return {
            errors: [
              {
                message: 'Enter a GraphQL query before running the explorer request.',
              },
            ],
          };
        }

        const variables =
          typeof graphQlParams.variables === 'string' ? parseGraphQlVariables(graphQlParams.variables) : (graphQlParams.variables ?? null);

        try {
          return await requestGraphQlOperation(appBridgeClient, {
            query,
            variables,
            operationName: graphQlParams.operationName ?? null,
          });
        } catch (error) {
          reportError(
            toAppError(error, {
              source: 'graphql',
              requestPath: '/graphql',
              fallbackMessage: 'The GraphQL request could not be completed.',
            }),
          );
          throw error;
        }
      },
    [appBridgeClient, reportError],
  );

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="api-explorer-title">
      <div className="app-modal-panel app-modal-panel--api-explorer">
        <div className="app-modal-header">
          <div className="app-section-grid">
            <h2 id="api-explorer-title" className="app-modal-title">
              {isGraphQlMode ? 'GraphQL API Explorer' : 'REST API Explorer'}
            </h2>
            <p className="app-muted-text">
              {isGraphQlMode
                ? 'Browse the transformed GraphQL schema directly inside the ERP dashboard.'
                : 'Explore the backend-served OpenAPI document directly inside the ERP dashboard.'}
            </p>
          </div>
          <Button type="button" variant="outline" label="Close Explorer" onClick={onClose} />
        </div>
        <div className="app-modal-body app-modal-body--api-explorer">
          {isGraphQlMode ? (
            errorMessage ? (
              <Alert title="GraphQL schema could not be loaded" description={errorMessage} variant="destructive" closable={false} />
            ) : graphQlSchemaObject ? (
              <div className="app-graphiql-shell">
                <GraphiQL
                  fetcher={graphQlFetcher}
                  schema={graphQlSchemaObject}
                  defaultQuery={DEFAULT_GRAPHIQL_QUERY}
                  plugins={[graphQlExplorerPlugin]}
                  {...(graphiQlStorage ? { storage: graphiQlStorage } : {})}
                />
              </div>
            ) : (
              <Alert
                title={graphQlSchema ? 'The GraphQL schema could not be prepared' : 'Loading GraphQL schema...'}
                description={graphQlSchema ? 'The GraphQL schema could not be parsed for GraphiQL.' : undefined}
                variant={graphQlSchema ? 'destructive' : 'info'}
                closable={false}
              />
            )
          ) : (
            <SwaggerUI url={buildBackendUrl('/openapi.json')} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ApiExplorerModal;

const DEFAULT_GRAPHIQL_QUERY = `query ExplorerHealthcheck {
  __typename
}`;

const graphiQlStorage = createNamespacedStorage('cloud-app-graphiql-v1');

function parseGraphQlVariables(variablesText: string): Record<string, unknown> | null {
  const trimmedVariablesText = variablesText.trim();

  if (!trimmedVariablesText) {
    return null;
  }

  return JSON.parse(trimmedVariablesText) as Record<string, unknown>;
}

function createNamespacedStorage(namespace: string): Storage | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }

  return {
    clear(): void {
      const keysToRemove = getNamespacedStorageKeys(namespace, window.localStorage);

      for (const key of keysToRemove) {
        window.localStorage.removeItem(key);
      }
    },
    get length(): number {
      return getNamespacedStorageKeys(namespace, window.localStorage).length;
    },
    getItem(key: string): string | null {
      return window.localStorage.getItem(getStorageKey(namespace, key));
    },
    key(index: number): string | null {
      return getNamespacedStorageKeys(namespace, window.localStorage)[index] ?? null;
    },
    removeItem(key: string): void {
      window.localStorage.removeItem(getStorageKey(namespace, key));
    },
    setItem(key: string, value: string): void {
      window.localStorage.setItem(getStorageKey(namespace, key), value);
    },
  };
}

function getStorageKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

function getNamespacedStorageKeys(namespace: string, storage: Storage): string[] {
  const storageKeyPrefix = `${namespace}:`;
  const keys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key?.startsWith(storageKeyPrefix)) {
      keys.push(key);
    }
  }

  return keys;
}
