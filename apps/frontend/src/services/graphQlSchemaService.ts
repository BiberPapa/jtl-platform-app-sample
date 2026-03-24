import type { AppBridgeClient } from './appBridgeClient';
import { createAppErrorFromBackendResponse, createGraphQlAppError, toAppError, type GraphQlExecutionError } from './appError';
import { requestBackend } from './apiClient';

export type GraphQlRequestPayload = {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
};

export async function requestGraphQlSchema(appBridgeClient: AppBridgeClient): Promise<string> {
  try {
    const response = await requestBackend({
      path: '/graphql/schema.graphql',
      appBridgeClient,
    });

    if (!response.ok) {
      throw createAppErrorFromBackendResponse(response, {
        source: 'graphql',
        requestPath: '/graphql/schema.graphql',
        fallbackMessage: 'The GraphQL schema could not be loaded.',
      });
    }

    return response.text;
  } catch (error) {
    throw toAppError(error, {
      source: 'graphql',
      requestPath: '/graphql/schema.graphql',
      fallbackMessage: 'The GraphQL schema could not be loaded.',
    });
  }
}

export async function requestGraphQlOperation(appBridgeClient: AppBridgeClient, payload: GraphQlRequestPayload): Promise<unknown> {
  try {
    const response = await requestBackend({
      path: '/graphql',
      method: 'POST',
      body: JSON.stringify(payload),
      appBridgeClient,
    });

    if (hasGraphQlErrors(response.json)) {
      throw createGraphQlAppError(
        response.json.errors,
        {
          source: 'graphql',
          requestPath: '/graphql',
          fallbackMessage: 'The GraphQL request could not be completed.',
          status: response.status,
          raw: response.json,
        },
        {
          query: payload.query,
        },
      );
    }

    if (!response.ok) {
      throw createAppErrorFromBackendResponse(response, {
        source: 'graphql',
        requestPath: '/graphql',
        fallbackMessage: 'The GraphQL request could not be completed.',
      });
    }

    return response.json;
  } catch (error) {
    throw toAppError(error, {
      source: 'graphql',
      requestPath: '/graphql',
      fallbackMessage: 'The GraphQL request could not be completed.',
    });
  }
}

function hasGraphQlErrors(value: unknown): value is { errors: GraphQlExecutionError[] } {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { errors?: unknown }).errors)) {
    return false;
  }

  return true;
}
