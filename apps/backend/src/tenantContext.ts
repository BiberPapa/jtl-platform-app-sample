import { getSessionContextFromToken } from './sessionToken.js';
import { AppError } from './errors/appError.js';

export type TenantContext = {
  sessionToken: string;
  tenantId: string;
  userId: string | null;
};

export async function resolveTenantContext(sessionToken: string | null): Promise<TenantContext> {
  if (!sessionToken) {
    throw new AppError('The X-Session-Token header is required.', {
      code: 'missing_session_token',
      publicMessage: 'A session token is required.',
      statusCode: 400,
    });
  }

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
  };
}
