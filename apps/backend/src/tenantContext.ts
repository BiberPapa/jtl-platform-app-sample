import { getSessionContextFromToken } from './sessionToken.js';
import { AppError } from './errors/appError.js';

export type TenantContext = {
  sessionToken: string | null;
  tenantId: string;
  userId: string | null;
  source: 'session-token' | 'nohub-env';
};

const NOHUB_TENANT_ENV_NAME = 'NOHUB_TENANT_ID';

export async function resolveTenantContext(sessionToken: string | null): Promise<TenantContext> {
  if (sessionToken) {
    let sessionContext;

    try {
      sessionContext = await getSessionContextFromToken(sessionToken);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(error instanceof Error ? error.message : 'The session token is invalid.', {
        cause: error,
        code: 'invalid_session_token',
        publicMessage: 'The session token is invalid.',
        statusCode: 401,
      });
    }

    return {
      sessionToken,
      tenantId: sessionContext.tenantId,
      userId: sessionContext.userId,
      source: 'session-token',
    };
  }

  const fallbackTenantId = getNohubTenantId();

  if (!fallbackTenantId) {
    throw new AppError(`Either the X-Session-Token header or ${NOHUB_TENANT_ENV_NAME} must be provided.`, {
      code: 'missing_tenant_context',
      publicMessage: 'A tenant context is required.',
      statusCode: 400,
    });
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
