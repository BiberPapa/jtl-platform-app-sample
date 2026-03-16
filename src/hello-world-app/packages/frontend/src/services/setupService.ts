import { apiUrl } from '../common/constants';

export type ConnectTenantResult = {
  message: string;
};

export async function connectTenant(sessionToken: string): Promise<ConnectTenantResult> {
  const response = await fetch(`${apiUrl}/connect-tenant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionToken,
    }),
  });

  const payload = (await response.json()) as { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'The backend rejected the tenant connection request.');
  }

  return { message: payload.message ?? 'Tenant connected successfully.' };
}
