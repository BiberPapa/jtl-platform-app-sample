import type { Request } from 'express';

const sessionTokenHeaderName = 'x-session-token';

export function getSessionTokenFromHeaders(headers: Request['headers']): string | null {
  const candidate = headers[sessionTokenHeaderName];

  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }

  return null;
}
