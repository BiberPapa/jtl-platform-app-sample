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

  const message = await response.text();

  if (!response.ok) {
    throw new Error(message || 'The backend rejected the tenant connection request.');
  }

  return { message };
}
