import { describe, expect, it } from 'vitest';
import { transformGraphQlSchema } from './graphQlSchemaDocument.js';

describe('transformGraphQlSchema', () => {
  it('returns the schema unchanged apart from removing a byte order mark', () => {
    expect(transformGraphQlSchema('\uFEFFtype Query {\n  ping: String!\n}\n')).toBe('type Query {\n  ping: String!\n}\n');
    expect(transformGraphQlSchema('type Query {\n  ping: String!\n}\n')).toBe('type Query {\n  ping: String!\n}\n');
  });
});
