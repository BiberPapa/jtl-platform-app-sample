import type { Response } from 'express';

const forwardedResponseHeaders = new Set([
  'api-supported-versions',
  'content-language',
  'content-type',
  'date',
  'server-timing',
]);

const corsSafelistedResponseHeaders = new Set(['cache-control', 'content-language', 'content-length', 'content-type', 'expires', 'last-modified', 'pragma']);

export function copyProxyResponseHeaders(headers: Headers, response: Response, backendDurationMs?: number): void {
  const exposedHeaders = new Set<string>();
  let forwardedServerTiming: string | null = null;

  for (const [headerName, headerValue] of headers.entries()) {
    const normalizedHeaderName = headerName.toLowerCase();

    if (!forwardedResponseHeaders.has(normalizedHeaderName)) {
      continue;
    }

    if (normalizedHeaderName === 'server-timing') {
      forwardedServerTiming = headerValue;
      continue;
    }

    response.set(headerName, headerValue);

    if (!corsSafelistedResponseHeaders.has(normalizedHeaderName)) {
      exposedHeaders.add(headerName);
    }
  }

  if (backendDurationMs !== undefined) {
    const backendServerTiming = formatBackendServerTiming(backendDurationMs);
    response.set('server-timing', forwardedServerTiming ? `${forwardedServerTiming}, ${backendServerTiming}` : backendServerTiming);
    exposedHeaders.add('server-timing');
  } else if (forwardedServerTiming) {
    response.set('server-timing', forwardedServerTiming);
    exposedHeaders.add('server-timing');
  }

  if (exposedHeaders.size > 0) {
    response.set('Access-Control-Expose-Headers', Array.from(exposedHeaders).join(', '));
  }
}

function formatBackendServerTiming(durationMs: number): string {
  return `backend-total;dur=${durationMs.toFixed(3)}`;
}
