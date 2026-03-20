import { apiUrl } from '../common/constants';

export type ConnectTenantResult = {
  message: string;
};

export async function connectTenant(sessionToken: string): Promise<ConnectTenantResult> {
  const response = await fetch(`${apiUrl}/connect-tenant`, {
    method: 'POST',
    headers: {
      'X-Session-Token': sessionToken,
    },
  });

  const responseText = await response.text();
  const payload = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'The backend rejected the tenant connection request.');
  }

  return { message: payload?.message ?? 'Tenant connected successfully.' };
}

function parseJsonResponse(responseText: string): { error?: string; message?: string } | null {
  if (responseText.length === 0) {
    return null;
  }

  try {
    return JSON.parse(responseText) as { error?: string; message?: string };
  } catch {
    return null;
  }
}
