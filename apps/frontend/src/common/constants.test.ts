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

  it('fails fast when VITE_API_URL is missing', async () => {
    vi.stubEnv('VITE_API_URL', '');

    await expect(import('./constants')).rejects.toThrowError('Missing required frontend configuration: VITE_API_URL.');
  });
});
