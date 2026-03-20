import type { RequestHandler } from 'express';
import { readOpenApiDocument } from '../services/openApiFile.js';
import { transformOpenApiDocument } from '../services/openApiDocument.js';

export const openApiHandler: RequestHandler = async (_req, res) => {
  try {
    const documentText = await readOpenApiDocument();
    const transformedDocument = transformOpenApiDocument(documentText);

    res.type('application/json').status(200).send(transformedDocument);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to read OpenAPI document',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
