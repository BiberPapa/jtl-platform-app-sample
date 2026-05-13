import { apiUrl } from '../common/constants';
import type { AppBridgeClient } from './appBridgeClient';

type BackendRequestOptions = {
  path: string;
  appBridgeClient: AppBridgeClient;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  body?: string;
};

export type BackendResponse = {
  ok: boolean;
  status: number;
  headers: Headers;
  text: string;
  json: unknown;
};

export async function requestBackend({ path, appBridgeClient, method = 'GET', body }: BackendRequestOptions): Promise<BackendResponse> {
  const sessionToken = await appBridgeClient.getSessionToken();

  if (!sessionToken) {
    throw new Error('A session token is required to access the backend.');
  }

  const requestInit: RequestInit = {
    method,
    headers: {
      'X-Session-Token': sessionToken,
    },
  };

  if (body !== undefined) {
    requestInit.body = body;
    requestInit.headers = {
      ...requestInit.headers,
      'Content-Type': 'application/json',
    };
  }

  const response = await fetch(buildBackendUrl(path), requestInit);
  const text = method === 'HEAD' || response.status === 204 ? '' : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    text,
    json: parseJsonResponse(text),
  };
}

export function buildBackendUrl(path: string): string {
  return `${apiUrl}${path}`;
}

function parseJsonResponse(responseText: string): unknown {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return null;
  }
}
