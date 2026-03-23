import type { AppBridgeClient } from './appBridgeClient';

export async function getGlobalTenantIdFromSessionToken(appBridgeClient: AppBridgeClient): Promise<string | null> {
  try {
    const sessionToken = await appBridgeClient.getSessionToken();

    if (!sessionToken) {
      return null;
    }

    return extractTenantIdFromSessionToken(sessionToken);
  } catch {
    return null;
  }
}

export function extractTenantIdFromSessionToken(sessionToken: string): string | null {
  const payloadSegment = sessionToken.split('.')[1];

  if (!payloadSegment) {
    return null;
  }

  try {
    const payloadText = decodeBase64Url(payloadSegment);
    const payload = JSON.parse(payloadText) as { tenantId?: unknown };

    return typeof payload.tenantId === 'string' && payload.tenantId.length > 0 ? payload.tenantId : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=');

  return atob(paddedValue);
}
