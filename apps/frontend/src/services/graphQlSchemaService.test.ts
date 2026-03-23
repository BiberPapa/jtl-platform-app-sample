import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBridgeClient } from './appBridgeClient';
import { AppError } from './appError';
import { requestGraphQlOperation, requestGraphQlSchema } from './graphQlSchemaService';

describe('graphQlSchemaService', () => {
  const getSessionTokenMock = vi.fn<() => Promise<string>>();
  const appBridgeClient: AppBridgeClient = {
    getSessionToken: getSessionTokenMock,
    setupCompleted: vi.fn<() => Promise<void>>(),
    getCurrentCustomerId: vi.fn<() => Promise<string>>(),
    subscribeToCustomerChanged: vi.fn(() => vi.fn()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getSessionTokenMock.mockResolvedValue('session-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the transformed GraphQL schema', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        text: 'type Query { ping: String! }',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(requestGraphQlSchema(appBridgeClient)).resolves.toBe('type Query { ping: String! }');
  });

  it('sends GraphQL operations to the backend proxy', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        text: '{"data":{"viewer":{"id":"1"}}}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      requestGraphQlOperation(appBridgeClient, {
        query: '{ viewer { id } }',
        variables: { includeMeta: true },
        operationName: 'Viewer',
      }),
    ).resolves.toEqual({
      data: {
        viewer: {
          id: '1',
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/graphql', {
      method: 'POST',
      headers: {
        'X-Session-Token': 'session-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ viewer { id } }',
        variables: { includeMeta: true },
        operationName: 'Viewer',
      }),
    });
  });

  it('throws a normalized GraphQL error when the response contains errors[]', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        text: '{"errors":[{"message":"Viewer failed","path":["viewer"],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}}]}',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const requestPromise = requestGraphQlOperation(appBridgeClient, {
      query: '{ viewer { id } }',
    });

    await expect(requestPromise).rejects.toBeInstanceOf(AppError);
    await expect(requestPromise).rejects.toMatchObject({
      details: {
        kind: 'graphql',
        code: 'GRAPHQL_VALIDATION_FAILED',
        userMessage: 'The GraphQL request could not be completed.',
      },
    });
  });
});

function createResponse({ ok, status, headers, text }: { ok: boolean; status?: number; headers?: Headers; text?: string }): Response {
  return {
    ok,
    status: status ?? (ok ? 200 : 500),
    headers: headers ?? new Headers(),
    text: vi.fn(() => Promise.resolve(text ?? '')),
  } as unknown as Response;
}
