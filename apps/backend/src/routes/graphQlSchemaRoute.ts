import { transformGraphQlSchema } from '../services/graphQlSchemaDocument.js';
import { readGraphQlSchemaDocument } from '../services/graphQlSchemaFile.js';
import { createRouteHandler } from './routeHandler.js';

export const graphQlSchemaHandler = createRouteHandler(
  { errorMessage: 'Failed to read GraphQL schema', route: '/graphql/schema.graphql' },
  async (_req, res) => {
    const schemaText = await readGraphQlSchemaDocument();
    const transformedSchema = transformGraphQlSchema(schemaText);

    res.type('text/plain').status(200).send(transformedSchema);
  },
);
