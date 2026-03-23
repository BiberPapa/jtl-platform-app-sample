import { getSessionContextFromToken } from './sessionToken.js';

export type TenantContext = {
  sessionToken: string | null;
  tenantId: string;
  userId: string | null;
  source: 'session-token' | 'nohub-env';
};

const NOHUB_TENANT_ENV_NAME = 'NOHUB_TENANT_ID';

export async function resolveTenantContext(sessionToken: string | null): Promise<TenantContext> {
  if (sessionToken) {
    const sessionContext = await getSessionContextFromToken(sessionToken);

    return {
      sessionToken,
      tenantId: sessionContext.tenantId,
      userId: sessionContext.userId,
      source: 'session-token',
    };
  }

  const fallbackTenantId = getNohubTenantId();

  if (!fallbackTenantId) {
    throw new Error(`Either the X-Session-Token header or ${NOHUB_TENANT_ENV_NAME} must be provided.`);
  }

  return {
    sessionToken: null,
    tenantId: fallbackTenantId,
    userId: null,
    source: 'nohub-env',
  };
}

function getNohubTenantId(): string | null {
  const configuredTenantId = process.env[NOHUB_TENANT_ENV_NAME];

  if (typeof configuredTenantId !== 'string') {
    return null;
  }

  const trimmedTenantId = configuredTenantId.trim();

  return trimmedTenantId.length > 0 ? trimmedTenantId : null;
}
