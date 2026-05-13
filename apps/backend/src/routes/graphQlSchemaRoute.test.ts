import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQlSchemaHandler } from './graphQlSchemaRoute.js';

const { readGraphQlSchemaDocumentMock, transformGraphQlSchemaMock } = vi.hoisted(() => ({
  readGraphQlSchemaDocumentMock: vi.fn<() => Promise<string>>(),
  transformGraphQlSchemaMock: vi.fn<(schemaText: string) => string>(),
}));

vi.mock('../services/graphQlSchemaFile.js', () => ({
  readGraphQlSchemaDocument: readGraphQlSchemaDocumentMock,
}));

vi.mock('../services/graphQlSchemaDocument.js', () => ({
  transformGraphQlSchema: transformGraphQlSchemaMock,
}));

describe('graphQlSchemaHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transformGraphQlSchemaMock.mockImplementation(schemaText => schemaText);
  });

  it('returns the transformed schema as plain text', async () => {
    readGraphQlSchemaDocumentMock.mockResolvedValueOnce('type Query { ping: String! }');
    transformGraphQlSchemaMock.mockReturnValueOnce('type Query { pong: String! }');
    const response = createResponseMock();

    await graphQlSchemaHandler({} as never, response as never, vi.fn() as never);

    expect(readGraphQlSchemaDocumentMock).toHaveBeenCalledTimes(1);
    expect(transformGraphQlSchemaMock).toHaveBeenCalledWith('type Query { ping: String! }');
    expect(response.type).toHaveBeenCalledWith('text/plain');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith('type Query { pong: String! }');
  });

  it('returns a structured error when the schema cannot be read', async () => {
    readGraphQlSchemaDocumentMock.mockRejectedValueOnce(new Error('Schema file missing.'));
    const response = createResponseMock();

    await graphQlSchemaHandler({} as never, response as never, vi.fn() as never);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to read GraphQL schema',
      message: 'Schema file missing.',
    });
  });
});

function createResponseMock(): Pick<Response, 'json' | 'send' | 'status' | 'type'> {
  const response = {
    locals: {},
    status: vi.fn(),
    type: vi.fn(),
    send: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);
  response.type.mockReturnValue(response);

  return response;
}
