const configuredApiUrl: unknown = import.meta.env['VITE_API_URL'];

export const apiUrl = getApiUrl(configuredApiUrl);

function getApiUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Missing required frontend configuration: VITE_API_URL.');
  }

  return value.trim();
}
