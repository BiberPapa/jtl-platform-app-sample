import { readFile } from 'node:fs/promises';

const graphQlSchemaDocumentUrl = new URL('../assets/schema.graphql', import.meta.url);

export async function readGraphQlSchemaDocument(): Promise<string> {
  return await readFile(graphQlSchemaDocumentUrl, 'utf8');
}
