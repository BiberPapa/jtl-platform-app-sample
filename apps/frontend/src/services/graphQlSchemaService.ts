import type { AppBridgeClient } from './appBridgeClient';
import { getBackendErrorMessage, requestBackend } from './apiClient';

export type GraphQlRequestPayload = {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
};

export async function requestGraphQlSchema(appBridgeClient: AppBridgeClient): Promise<string> {
  const response = await requestBackend({
    path: '/graphql/schema.graphql',
    appBridgeClient,
  });

  if (!response.ok) {
    throw new Error(getBackendErrorMessage(response, 'The GraphQL schema could not be loaded.'));
  }

  return response.text;
}

export async function requestGraphQlOperation(appBridgeClient: AppBridgeClient, payload: GraphQlRequestPayload): Promise<unknown> {
  const response = await requestBackend({
    path: '/graphql',
    method: 'POST',
    body: JSON.stringify(payload),
    appBridgeClient,
  });

  if (!response.ok) {
    throw new Error(getBackendErrorMessage(response, 'The GraphQL request could not be completed.'));
  }

  return response.json;
}
