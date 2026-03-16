export type ErpProxyInput = {
  method: string;
  tenantId: string;
  endpoint: string;
  body: unknown;
};

export type ErpProxyRequest = {
  tenantId: string;
  endpoint: string;
  body: unknown;
};

/**
 * Normalizes ERP proxy input by allowing body-based tenant and endpoint overrides for write requests.
 */
export function buildErpProxyRequest({ body, endpoint, method, tenantId }: ErpProxyInput): ErpProxyRequest {
  if (!['POST', 'PUT', 'PATCH'].includes(method) || !isObjectRecord(body)) {
    return { tenantId, endpoint, body };
  }

  const nextTenantId = typeof body._tenantId === 'string' ? body._tenantId : tenantId;
  const nextEndpoint = typeof body._endpoint === 'string' ? body._endpoint : endpoint;
  const cleanBody = Object.fromEntries(Object.entries(body).filter(([key]) => key !== '_endpoint' && key !== '_tenantId'));

  return {
    tenantId: nextTenantId,
    endpoint: nextEndpoint,
    body: cleanBody,
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
