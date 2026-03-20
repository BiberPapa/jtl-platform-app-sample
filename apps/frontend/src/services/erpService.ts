import { apiUrl } from '../common/constants';
import type { AppBridgeClient } from './appBridgeClient';

export type ErpInfoResponse = {
  version: string;
  timestamp: string;
  tenant: string;
  type: string;
};

export type ErpInfoStatus = {
  reachable: boolean;
  tenantId: string | null;
  version: string | null;
  totalTimeMs: number | null;
  erpTimeMs: number | null;
  infrastructureTimeMs: number | null;
  frontendTimeMs: number | null;
  errorMessage: string | null;
};

export type AuthorizationStatus = {
  state: 'authorized' | 'unauthorized' | 'error';
  message: string | null;
};

export type PlaygroundRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

export type PlaygroundRequestResult = {
  ok: boolean;
  status: number;
  responseTimeMs: number;
  route: string;
  method: PlaygroundRequestMethod;
  body: unknown;
};

export async function requestErpInfoStatus(appBridgeClient: AppBridgeClient): Promise<ErpInfoStatus> {
  const sessionToken = await appBridgeClient.getSessionToken();
  const v2Info = await requestInfoEndpoint('/v2/info', sessionToken);

  if (v2Info.info) {
    return {
      reachable: true,
      tenantId: v2Info.info.tenant,
      version: v2Info.info.version,
      totalTimeMs: v2Info.totalTimeMs,
      erpTimeMs: v2Info.erpTimeMs,
      infrastructureTimeMs: v2Info.infrastructureTimeMs,
      frontendTimeMs: calculateFrontendTime(v2Info.totalTimeMs, v2Info.infrastructureTimeMs),
      errorMessage: null,
    };
  }

  return {
    reachable: false,
    tenantId: null,
    version: null,
    totalTimeMs: v2Info.totalTimeMs,
    erpTimeMs: v2Info.erpTimeMs,
    infrastructureTimeMs: v2Info.infrastructureTimeMs,
    frontendTimeMs: calculateFrontendTime(v2Info.totalTimeMs, v2Info.infrastructureTimeMs),
    errorMessage: v2Info.errorMessage || 'The /v2/info endpoint could not be loaded.',
  };
}

export async function requestAuthorizationStatus(appBridgeClient: AppBridgeClient): Promise<AuthorizationStatus> {
  const sessionToken = await appBridgeClient.getSessionToken();

  try {
    const response = await fetch(`${apiUrl}/erp/workers`, {
      headers: {
        'X-Session-Token': sessionToken,
      },
    });

    if (response.ok) {
      return {
        state: 'authorized',
        message: null,
      };
    }

    const errorText = await response.text();
    const message = errorText || 'The authorization status could not be determined.';

    if (/authorization/i.test(message)) {
      return {
        state: 'unauthorized',
        message,
      };
    }

    return {
      state: 'error',
      message,
    };
  } catch (error) {
    return {
      state: 'error',
      message: error instanceof Error ? error.message : 'The authorization status could not be determined.',
    };
  }
}

export async function requestPlaygroundRequest(
  appBridgeClient: AppBridgeClient,
  request: { route: string; method: PlaygroundRequestMethod },
): Promise<PlaygroundRequestResult> {
  const sessionToken = await appBridgeClient.getSessionToken();
  const normalizedRoute = normalizePlaygroundRoute(request.route);
  const startedAt = performance.now();
  const response = await fetch(`${apiUrl}/erp${normalizedRoute}`, {
    method: request.method,
    headers: {
      'X-Session-Token': sessionToken,
    },
  });
  const responseTimeMs = Math.round(performance.now() - startedAt);
  const responseText = request.method === 'HEAD' || response.status === 204 ? '' : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    responseTimeMs,
    route: normalizedRoute,
    method: request.method,
    body: parsePlaygroundBody(responseText),
  };
}

async function requestInfoEndpoint(
  endpointPath: '/v2/info',
  sessionToken: string,
): Promise<{
  info: ErpInfoResponse | null;
  totalTimeMs: number;
  erpTimeMs: number | null;
  infrastructureTimeMs: number | null;
  errorMessage: string | null;
}> {
  try {
    const startedAt = performance.now();
    const response = await fetch(`${apiUrl}/erp${endpointPath}`, {
      headers: {
        'X-Session-Token': sessionToken,
      },
    });
    const totalTimeMs = Math.round(performance.now() - startedAt);
    const { erpTimeMs, infrastructureTimeMs } = parseServerTimingDurations(response.headers.get('server-timing'));

    if (!response.ok) {
      const errorText = await response.text();

      return {
        info: null,
        totalTimeMs,
        erpTimeMs,
        infrastructureTimeMs,
        errorMessage: errorText || `The ${endpointPath} endpoint could not be loaded.`,
      };
    }

    return {
      info: (await response.json()) as ErpInfoResponse,
      totalTimeMs,
      erpTimeMs,
      infrastructureTimeMs,
      errorMessage: null,
    };
  } catch (error) {
    return {
      info: null,
      totalTimeMs: 0,
      erpTimeMs: null,
      infrastructureTimeMs: null,
      errorMessage: error instanceof Error ? error.message : `The ${endpointPath} endpoint could not be loaded.`,
    };
  }
}

function normalizePlaygroundRoute(route: string): string {
  const trimmedRoute = route.trim();

  if (!trimmedRoute) {
    return '/';
  }

  return trimmedRoute.startsWith('/') ? trimmedRoute : `/${trimmedRoute}`;
}

function parsePlaygroundBody(responseText: string): unknown {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function parseServerTimingDurations(serverTimingHeader: string | null): {
  erpTimeMs: number | null;
  infrastructureTimeMs: number | null;
} {
  if (!serverTimingHeader) {
    return {
      erpTimeMs: null,
      infrastructureTimeMs: null,
    };
  }

  return {
    erpTimeMs: parseServerTimingMetric(serverTimingHeader, 'erpapi-total'),
    infrastructureTimeMs: parseServerTimingMetric(serverTimingHeader, 'backend-total'),
  };
}

function parseServerTimingMetric(serverTimingHeader: string, metricName: string): number | null {
  const durationMatch = new RegExp(`(?:^|,)\\s*${metricName}\\s*;\\s*dur=([0-9.]+)`, 'i').exec(serverTimingHeader);

  if (!durationMatch) {
    return null;
  }

  const duration = Number(durationMatch[1]);

  return Number.isFinite(duration) ? duration : null;
}

function calculateFrontendTime(totalTimeMs: number | null, infrastructureTimeMs: number | null): number | null {
  if (totalTimeMs == null || infrastructureTimeMs == null) {
    return null;
  }

  return Math.max(0, Number((totalTimeMs - infrastructureTimeMs).toFixed(3)));
}
