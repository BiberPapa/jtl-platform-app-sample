import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openApiHandler } from './openApiRoute.js';

const { readOpenApiDocumentMock, transformOpenApiDocumentMock } = vi.hoisted(() => ({
  readOpenApiDocumentMock: vi.fn<() => Promise<string>>(),
  transformOpenApiDocumentMock: vi.fn<(documentText: string) => string>(),
}));

vi.mock('../services/openApiFile.js', () => ({
  readOpenApiDocument: readOpenApiDocumentMock,
}));

vi.mock('../services/openApiDocument.js', () => ({
  transformOpenApiDocument: transformOpenApiDocumentMock,
}));

describe('openApiHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transformOpenApiDocumentMock.mockImplementation(documentText => documentText);
  });

  it('returns the transformed OpenAPI document as JSON', async () => {
    readOpenApiDocumentMock.mockResolvedValueOnce('{"openapi":"3.0.1"}');
    transformOpenApiDocumentMock.mockReturnValueOnce('{"openapi":"3.0.3"}');
    const response = createResponseMock();

    await openApiHandler({} as never, response as never, vi.fn() as never);

    expect(readOpenApiDocumentMock).toHaveBeenCalledTimes(1);
    expect(transformOpenApiDocumentMock).toHaveBeenCalledWith('{"openapi":"3.0.1"}');
    expect(response.type).toHaveBeenCalledWith('application/json');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith('{"openapi":"3.0.3"}');
  });

  it('returns a structured error when loading the document fails', async () => {
    readOpenApiDocumentMock.mockRejectedValueOnce(new Error('OpenAPI file missing.'));
    const response = createResponseMock();

    await openApiHandler({} as never, response as never, vi.fn() as never);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to read OpenAPI document',
      message: 'OpenAPI file missing.',
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
