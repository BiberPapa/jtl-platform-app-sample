import type { RequestHandler } from 'express';
import { transformGraphQlSchema } from '../services/graphQlSchemaDocument.js';
import { readGraphQlSchemaDocument } from '../services/graphQlSchemaFile.js';

export const graphQlSchemaHandler: RequestHandler = async (_req, res) => {
  try {
    const schemaText = await readGraphQlSchemaDocument();
    const transformedSchema = transformGraphQlSchema(schemaText);

    res.type('text/plain').status(200).send(transformedSchema);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to read GraphQL schema',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
