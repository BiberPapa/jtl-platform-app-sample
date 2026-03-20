import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, expect, vi } from 'vitest';

expect.extend(matchers);

vi.stubEnv('VITE_API_URL', 'https://api.example.test');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_API_URL', 'https://api.example.test');
});
