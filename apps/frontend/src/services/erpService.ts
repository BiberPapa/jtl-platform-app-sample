import type { AppBridgeClient } from './appBridgeClient';
import { createAppErrorFromBackendResponse, createUnexpectedAppError, toAppError, type AppError } from './appError';
import { requestBackend } from './apiClient';

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
  error: AppError | null;
};

export type AuthorizationStatus = {
  state: 'authorized' | 'unauthorized' | 'error';
  message: string | null;
  error: AppError | null;
};

export type PlaygroundRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

export type PlaygroundRequestResult = {
  ok: boolean;
  status: number;
  responseTimeMs: number;
  route: string;
  method: PlaygroundRequestMethod;
  body: unknown;
  error: AppError | null;
};

export async function requestErpInfoStatus(appBridgeClient: AppBridgeClient): Promise<ErpInfoStatus> {
  const v2Info = await requestInfoEndpoint('/v2/info', appBridgeClient);

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
      error: null,
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
    errorMessage: v2Info.error?.details.userMessage ?? v2Info.errorMessage ?? 'The /v2/info endpoint could not be loaded.',
    error: v2Info.error,
  };
}

export async function requestAuthorizationStatus(appBridgeClient: AppBridgeClient): Promise<AuthorizationStatus> {
  try {
    const response = await requestBackend({
      path: '/erp/workers',
      appBridgeClient,
    });

    if (response.ok) {
      return {
        state: 'authorized',
        message: null,
        error: null,
      };
    }

    const error = createAppErrorFromBackendResponse(response, {
      source: 'erp',
      requestPath: '/erp/workers',
      fallbackMessage: 'The authorization status could not be determined.',
    });

    if (response.status === 401 || response.status === 403) {
      return {
        state: 'unauthorized',
        message: error.details.userMessage,
        error,
      };
    }

    return {
      state: 'error',
      message: error.details.userMessage,
      error,
    };
  } catch (error) {
    const appError = toAppError(error, {
      source: 'erp',
      requestPath: '/erp/workers',
      fallbackMessage: 'The authorization status could not be determined.',
    });

    return {
      state: 'error',
      message: appError.details.userMessage,
      error: appError,
    };
  }
}

export async function requestPlaygroundRequest(
  appBridgeClient: AppBridgeClient,
  request: { route: string; method: PlaygroundRequestMethod },
): Promise<PlaygroundRequestResult> {
  const normalizedRoute = normalizePlaygroundRoute(request.route);
  const startedAt = performance.now();
  const response = await requestBackend({
    path: `/erp${normalizedRoute}`,
    method: request.method,
    appBridgeClient,
  });
  const responseTimeMs = Math.round(performance.now() - startedAt);

  return {
    ok: response.ok,
    status: response.status,
    responseTimeMs,
    route: normalizedRoute,
    method: request.method,
    body: parsePlaygroundBody(response.text),
    error: response.ok
      ? null
      : createAppErrorFromBackendResponse(response, {
          source: 'erp',
          requestPath: `/erp${normalizedRoute}`,
          fallbackMessage: `The ${normalizedRoute} request could not be completed.`,
        }),
  };
}

async function requestInfoEndpoint(
  endpointPath: '/v2/info',
  appBridgeClient: AppBridgeClient,
): Promise<{
  info: ErpInfoResponse | null;
  totalTimeMs: number;
  erpTimeMs: number | null;
  infrastructureTimeMs: number | null;
  errorMessage: string | null;
  error: AppError | null;
}> {
  try {
    const startedAt = performance.now();
    const response = await requestBackend({
      path: `/erp${endpointPath}`,
      appBridgeClient,
    });
    const totalTimeMs = Math.round(performance.now() - startedAt);
    const { erpTimeMs, infrastructureTimeMs } = parseServerTimingDurations(response.headers.get('server-timing'));

    if (!response.ok) {
      return {
        info: null,
        totalTimeMs,
        erpTimeMs,
        infrastructureTimeMs,
        errorMessage: null,
        error: createAppErrorFromBackendResponse(response, {
          source: 'erp',
          requestPath: `/erp${endpointPath}`,
          fallbackMessage: `The ${endpointPath} endpoint could not be loaded.`,
        }),
      };
    }

    const payloadError = isErpInfoResponse(response.json)
      ? null
      : createUnexpectedAppError({
          source: 'erp',
          requestPath: `/erp${endpointPath}`,
          fallbackMessage: `The ${endpointPath} endpoint returned an unexpected payload.`,
          status: response.status,
          raw: response.json,
        });

    return {
      info: isErpInfoResponse(response.json) ? response.json : null,
      totalTimeMs,
      erpTimeMs,
      infrastructureTimeMs,
      errorMessage: payloadError?.details.userMessage ?? null,
      error: payloadError,
    };
  } catch (error) {
    const appError = toAppError(error, {
      source: 'erp',
      requestPath: `/erp${endpointPath}`,
      fallbackMessage: `The ${endpointPath} endpoint could not be loaded.`,
    });

    return {
      info: null,
      totalTimeMs: 0,
      erpTimeMs: null,
      infrastructureTimeMs: null,
      errorMessage: appError.details.userMessage,
      error: appError,
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

function isErpInfoResponse(value: unknown): value is ErpInfoResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate['version'] === 'string' &&
    typeof candidate['timestamp'] === 'string' &&
    typeof candidate['tenant'] === 'string' &&
    typeof candidate['type'] === 'string'
  );
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
