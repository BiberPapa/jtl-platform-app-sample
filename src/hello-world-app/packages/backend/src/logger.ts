import { pino } from 'pino';

const maskedHeaderValues = new Set(['authorization', 'x-session-token']);
const defaultBodyMaxLength = 4096;

export type ProxyLogLevel = 'off' | 'basic' | 'verbose';

type LoggedBody =
  | { kind: 'empty' }
  | { kind: 'text'; value: string; truncated: boolean; originalLength: number; loggedLength: number }
  | { kind: 'non-text'; type: string };

export const logger = pino({
  level: getAppLogLevel(process.env.LOG_LEVEL),
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function getConfiguredProxyLogLevel(): ProxyLogLevel {
  return getProxyLogLevel(process.env.ERP_PROXY_LOG_LEVEL, process.env.DEBUG_ERP_PROXY, process.env.NODE_ENV);
}

export function getConfiguredProxyBodyMaxLength(): number {
  return getProxyBodyMaxLength(process.env.ERP_PROXY_LOG_BODY_MAX_LENGTH);
}

export function getAppLogLevel(value: string | undefined): 'error' | 'warn' | 'info' | 'debug' {
  if (value === 'error' || value === 'warn' || value === 'info' || value === 'debug') {
    return value;
  }

  return process.env.NODE_ENV === 'production' ? 'warn' : 'info';
}

export function getProxyLogLevel(value: string | undefined, legacyValue: string | undefined, nodeEnv: string | undefined): ProxyLogLevel {
  if (value === 'off' || value === 'basic' || value === 'verbose') {
    return value;
  }

  if (legacyValue === 'basic' || legacyValue === 'verbose') {
    return legacyValue;
  }

  if (legacyValue === 'true') {
    return 'basic';
  }

  if (nodeEnv === 'development') {
    return 'basic';
  }

  return 'off';
}

export function getProxyBodyMaxLength(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultBodyMaxLength;
}

export function sanitizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }

  const entries = headers instanceof Headers ? Array.from(headers.entries()) : Array.isArray(headers) ? headers : Object.entries(headers);

  return Object.fromEntries(
    entries.map(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      const normalizedValue = Array.isArray(value) ? value.join(', ') : String(value);

      return [key, maskedHeaderValues.has(normalizedKey) ? '<redacted>' : normalizedValue];
    }),
  );
}

export function serializeLoggedBody(body: unknown, maxLength = getConfiguredProxyBodyMaxLength()): LoggedBody {
  if (body == null || body === '') {
    return { kind: 'empty' };
  }

  if (typeof body === 'string') {
    return truncateText(body, maxLength);
  }

  if (typeof body === 'object' && body instanceof ArrayBuffer) {
    return { kind: 'non-text', type: 'ArrayBuffer' };
  }

  if (typeof body === 'object' && ArrayBuffer.isView(body)) {
    return { kind: 'non-text', type: body.constructor.name };
  }

  if (typeof body === 'object') {
    try {
      return truncateText(JSON.stringify(body), maxLength);
    } catch {
      return { kind: 'non-text', type: 'unserializable-object' };
    }
  }

  if (typeof body === 'number' || typeof body === 'boolean' || typeof body === 'bigint') {
    return truncateText(String(body), maxLength);
  }

  return { kind: 'non-text', type: typeof body };
}

function truncateText(value: string, maxLength: number): LoggedBody {
  const truncated = value.length > maxLength;
  const loggedValue = truncated ? value.slice(0, maxLength) : value;

  return {
    kind: 'text',
    value: loggedValue,
    truncated,
    originalLength: value.length,
    loggedLength: loggedValue.length,
  };
}
