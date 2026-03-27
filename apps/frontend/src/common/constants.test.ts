import { afterEach, describe, expect, it, vi } from 'vitest';

describe('apiUrl configuration', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('uses the configured API URL', async () => {
    vi.stubEnv('VITE_API_URL', ' https://api.example.test ');

    const module = await import('./constants');

    expect(module.apiUrl).toBe('https://api.example.test');
  });

  it('defaults the dummy app bridge flag to false when omitted', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');

    const module = await import('./constants');

    expect(module.useDummyAppBridge).toBe(false);
  });

  it('uses the configured dummy app bridge flag', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');
    vi.stubEnv('VITE_USE_DUMMY_APP_BRIDGE', ' true ');

    const module = await import('./constants');

    expect(module.useDummyAppBridge).toBe(true);
  });

  it('fails fast when the dummy app bridge flag is invalid', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');
    vi.stubEnv('VITE_USE_DUMMY_APP_BRIDGE', 'sometimes');

    await expect(import('./constants')).rejects.toThrowError('Invalid frontend configuration: VITE_USE_DUMMY_APP_BRIDGE must be "true" or "false".');
  });

  it('fails fast when VITE_API_URL is missing', async () => {
    vi.stubEnv('VITE_API_URL', '');

    await expect(import('./constants')).rejects.toThrowError('Missing required frontend configuration: VITE_API_URL.');
  });
});
