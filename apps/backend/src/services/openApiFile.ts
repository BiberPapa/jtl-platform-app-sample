import { readFile } from 'node:fs/promises';

const openApiDocumentUrl = new URL('../assets/openapi.json', import.meta.url);

export async function readOpenApiDocument(): Promise<string> {
  return await readFile(openApiDocumentUrl, 'utf8');
}
