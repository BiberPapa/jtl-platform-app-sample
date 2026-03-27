const configuredApiUrl: unknown = import.meta.env['VITE_API_URL'];
const configuredDummyAppBridgeFallback: unknown = import.meta.env['VITE_USE_DUMMY_APP_BRIDGE'];

export const apiUrl = getApiUrl(configuredApiUrl);
export const useDummyAppBridge = getOptionalBoolean(configuredDummyAppBridgeFallback);

function getApiUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Missing required frontend configuration: VITE_API_URL.');
  }

  return value.trim();
}

function getOptionalBoolean(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value !== 'string') {
    throw new Error('Invalid frontend configuration: VITE_USE_DUMMY_APP_BRIDGE must be "true" or "false".');
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue.length === 0) {
    return false;
  }

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  throw new Error('Invalid frontend configuration: VITE_USE_DUMMY_APP_BRIDGE must be "true" or "false".');
}
