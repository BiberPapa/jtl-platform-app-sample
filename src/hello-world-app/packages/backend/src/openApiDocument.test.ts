import { describe, expect, it } from 'vitest';
import { rewriteOpenApiResponse } from './openApiDocument.js';

describe('rewriteOpenApiResponse', () => {
  it('rewrites ERP OpenAPI documents for backend consumption', () => {
    const result = rewriteOpenApiResponse({
      endpoint: 'openapi.json',
      method: 'GET',
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        openapi: '3.0.0',
        servers: [{ url: 'https://api.jtl-cloud.com/erp' }],
        security: [{ bearerAuth: [] }],
        paths: {
          '/customers': {
            get: {
              security: [{ bearerAuth: [] }],
              parameters: [
                { name: 'X-Tenant-ID', in: 'header', required: true },
                { name: 'limit', in: 'query', schema: { type: 'integer' } },
                { $ref: '#/components/parameters/AuthHeader' },
              ],
            },
          },
        },
        components: {
          parameters: {
            AuthHeader: { name: 'Authorization', in: 'header', schema: { type: 'string' } },
            CustomerId: { name: 'customerId', in: 'path', required: true, schema: { type: 'string' } },
          },
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer' },
          },
          schemas: {
            Customer: {
              type: 'object',
              properties: {
                self: { $ref: '/schemas/customer.json#/Customer' },
              },
            },
          },
        },
      }),
    });

    expect(result).not.toBeNull();

    const document = JSON.parse(result!.body) as {
      servers: Array<{ url: string }>;
      security: Array<Record<string, string[]>>;
      paths: Record<string, { get: { parameters: Array<{ name?: string; in?: string }> } }>;
      components: {
        parameters: Record<string, unknown>;
        securitySchemes: Record<string, unknown>;
        schemas: {
          Customer: {
            properties: {
              self: { $ref: string };
            };
          };
        };
      };
    };

    expect(document.servers).toEqual([{ url: '/' }]);
    expect(document.security).toEqual([{ SessionTokenHeader: [] }]);
    expect(Object.keys(document.paths)).toEqual(['/erp/customers']);
    const customersPath = document.paths['/erp/customers'];

    expect(customersPath).toBeDefined();
    expect(customersPath!.get.parameters).toEqual([{ name: 'limit', in: 'query', schema: { type: 'integer' } }]);
    expect(document.components.parameters).toEqual({
      CustomerId: { name: 'customerId', in: 'path', required: true, schema: { type: 'string' } },
    });
    expect(document.components.securitySchemes).toEqual({
      SessionTokenHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Session-Token',
      },
    });
    expect(document.components.schemas.Customer.properties.self.$ref).toBe('/erp/schemas/customer.json#/Customer');
  });

  it('keeps relative json refs unchanged so nested backend refs still resolve', () => {
    const result = rewriteOpenApiResponse({
      endpoint: 'schemas/customer.json',
      method: 'GET',
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'object',
        properties: {
          address: {
            $ref: './address.json#/Address',
          },
        },
      }),
    });

    expect(result).not.toBeNull();
    const document = JSON.parse(result!.body) as { servers?: unknown; properties: { address: { $ref: string } } };

    expect(document.properties.address.$ref).toBe('./address.json#/Address');
    expect(document.servers).toBeUndefined();
  });

  it('does not rewrite non-json or non-get responses', () => {
    expect(
      rewriteOpenApiResponse({
        endpoint: 'openapi.json',
        method: 'POST',
        contentType: 'application/json',
        body: '{}',
      }),
    ).toBeNull();

    expect(
      rewriteOpenApiResponse({
        endpoint: 'customers',
        method: 'GET',
        contentType: 'application/json',
        body: '{}',
      }),
    ).toBeNull();
  });
});
