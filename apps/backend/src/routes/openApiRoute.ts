import { readOpenApiDocument } from '../services/openApiFile.js';
import { transformOpenApiDocument } from '../services/openApiDocument.js';
import { createRouteHandler } from './routeHandler.js';

export const openApiHandler = createRouteHandler({ errorMessage: 'Failed to read OpenAPI document', route: '/openapi.json' }, async (_req, res) => {
  const documentText = await readOpenApiDocument();
  const transformedDocument = transformOpenApiDocument(documentText);

  res.type('application/json').status(200).send(transformedDocument);
});
