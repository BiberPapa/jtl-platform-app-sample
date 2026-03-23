import type { BackendResponse } from './apiClient';

export type AppErrorKind = 'backend' | 'graphql' | 'network' | 'unexpected';

export type AppErrorSource = 'erp' | 'graphql' | 'setup' | 'app-info' | 'bridge' | 'unknown';

export type ValidationIssue = {
  field: string | null;
  messages: string[];
};

export type AppErrorDetails = {
  kind: AppErrorKind;
  source: AppErrorSource;
  code: string;
  userMessage: string;
  technicalMessage: string;
  validationErrors: ValidationIssue[];
  status: number | null;
  timestamp: string;
  requestPath: string | null;
  raw: unknown;
};

export type AppErrorFallback = {
  source: AppErrorSource;
  fallbackMessage: string;
  requestPath?: string | null;
  status?: number | null;
  raw?: unknown;
};

export type GraphQlExecutionError = {
  message?: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

type AspNetErrorPayload = {
  ErrorCode?: unknown;
  ValidationErrors?: unknown;
  Errors?: unknown;
  ErrorMessage?: unknown;
  Stacktrace?: unknown;
};

export class AppError extends Error {
  readonly details: AppErrorDetails;

  constructor(details: AppErrorDetails) {
    super(details.userMessage);
    this.name = 'AppError';
    this.details = details;
  }
}

export function createAppErrorFromBackendResponse(response: Pick<BackendResponse, 'status' | 'text' | 'json'>, fallback: AppErrorFallback): AppError {
  const aspNetPayload = isAspNetErrorPayload(response.json) ? response.json : null;
  const validationErrors = normalizeValidationErrors(aspNetPayload);
  const code = getBackendErrorCode(aspNetPayload, response.status);
  const technicalMessage = getBackendTechnicalMessage(aspNetPayload, response.text, fallback.fallbackMessage);

  return new AppError({
    kind: 'backend',
    source: fallback.source,
    code,
    userMessage: getBackendUserMessage({
      fallbackMessage: fallback.fallbackMessage,
      status: response.status,
      validationErrors,
    }),
    technicalMessage,
    validationErrors,
    status: response.status,
    timestamp: new Date().toISOString(),
    requestPath: fallback.requestPath ?? null,
    raw: response.json ?? fallback.raw ?? response.text,
  });
}

export function createGraphQlAppError(graphQlErrors: GraphQlExecutionError[], fallback: AppErrorFallback): AppError {
  const validationErrors = graphQlErrors.map(error => ({
    field: error.path?.length ? error.path.join('.') : null,
    messages: [typeof error.message === 'string' ? error.message : 'Unknown GraphQL error'],
  }));
  const firstError = graphQlErrors[0];
  const technicalMessage =
    graphQlErrors
      .map(error => (typeof error.message === 'string' ? error.message : null))
      .filter((message): message is string => Boolean(message))
      .join('\n') || fallback.fallbackMessage;

  return new AppError({
    kind: 'graphql',
    source: fallback.source,
    code: getGraphQlErrorCode(firstError),
    userMessage: fallback.fallbackMessage,
    technicalMessage,
    validationErrors,
    status: fallback.status ?? 200,
    timestamp: new Date().toISOString(),
    requestPath: fallback.requestPath ?? null,
    raw: fallback.raw ?? { errors: graphQlErrors },
  });
}

export function createUnexpectedAppError(fallback: AppErrorFallback): AppError {
  return new AppError({
    kind: 'unexpected',
    source: fallback.source,
    code: 'UNEXPECTED_ERROR',
    userMessage: fallback.fallbackMessage,
    technicalMessage: getUnknownTechnicalMessage(fallback.raw, fallback.fallbackMessage),
    validationErrors: [],
    status: fallback.status ?? null,
    timestamp: new Date().toISOString(),
    requestPath: fallback.requestPath ?? null,
    raw: fallback.raw ?? null,
  });
}

export function toAppError(error: unknown, fallback: AppErrorFallback): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof TypeError) {
    return new AppError({
      kind: 'network',
      source: fallback.source,
      code: 'NETWORK_ERROR',
      userMessage: fallback.fallbackMessage,
      technicalMessage: error.message || fallback.fallbackMessage,
      validationErrors: [],
      status: fallback.status ?? null,
      timestamp: new Date().toISOString(),
      requestPath: fallback.requestPath ?? null,
      raw: error,
    });
  }

  if (error instanceof Error) {
    return new AppError({
      kind: 'unexpected',
      source: fallback.source,
      code: 'UNEXPECTED_ERROR',
      userMessage: fallback.fallbackMessage,
      technicalMessage: error.message || fallback.fallbackMessage,
      validationErrors: [],
      status: fallback.status ?? null,
      timestamp: new Date().toISOString(),
      requestPath: fallback.requestPath ?? null,
      raw: error,
    });
  }

  return createUnexpectedAppError({
    ...fallback,
    raw: error,
  });
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function getErrorFingerprint(error: AppErrorDetails): string {
  return JSON.stringify({
    kind: error.kind,
    source: error.source,
    code: error.code,
    status: error.status,
    requestPath: error.requestPath,
    technicalMessage: error.technicalMessage,
  });
}

function isAspNetErrorPayload(value: unknown): value is AspNetErrorPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    'ErrorCode' in candidate || 'ValidationErrors' in candidate || 'Errors' in candidate || 'ErrorMessage' in candidate || 'Stacktrace' in candidate
  );
}

function normalizeValidationErrors(payload: AspNetErrorPayload | null): ValidationIssue[] {
  if (!payload) {
    return [];
  }

  return [...normalizeErrorLists(payload.Errors), ...normalizeValidationMap(payload.ValidationErrors)];
}

function normalizeErrorLists(value: unknown): ValidationIssue[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const issues: ValidationIssue[] = [];

  for (const [field, messages] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(messages)) {
      continue;
    }

    const nextMessages = messages.filter((message): message is string => typeof message === 'string' && message.trim().length > 0);

    if (!nextMessages.length) {
      continue;
    }

    issues.push({
      field,
      messages: nextMessages,
    });
  }

  return issues;
}

function normalizeValidationMap(value: unknown): ValidationIssue[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const issues: ValidationIssue[] = [];

  for (const [field, message] of Object.entries(value as Record<string, unknown>)) {
    if (typeof message !== 'string' || !message.trim()) {
      continue;
    }

    issues.push({
      field,
      messages: [message],
    });
  }

  return issues;
}

function getBackendErrorCode(payload: AspNetErrorPayload | null, status: number | null): string {
  if (payload && typeof payload.ErrorCode === 'string' && payload.ErrorCode.trim()) {
    return payload.ErrorCode.trim();
  }

  if (status != null) {
    return `HTTP_${status}`;
  }

  return 'BACKEND_ERROR';
}

function getBackendTechnicalMessage(payload: AspNetErrorPayload | null, responseText: string, fallbackMessage: string): string {
  if (payload && typeof payload.ErrorMessage === 'string' && payload.ErrorMessage.trim()) {
    return payload.ErrorMessage.trim();
  }

  if (responseText.trim()) {
    return responseText.trim();
  }

  return fallbackMessage;
}

function getBackendUserMessage(input: { fallbackMessage: string; status: number | null; validationErrors: ValidationIssue[] }): string {
  if (input.validationErrors.length > 0) {
    return 'Some of the provided data could not be validated.';
  }

  if (input.status === 401 || input.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  return input.fallbackMessage;
}

function getGraphQlErrorCode(error: GraphQlExecutionError | undefined): string {
  const extensionCode = error?.extensions?.['code'];

  return typeof extensionCode === 'string' && extensionCode.trim() ? extensionCode : 'GRAPHQL_ERROR';
}

function getUnknownTechnicalMessage(value: unknown, fallbackMessage: string): string {
  if (value instanceof Error && value.message) {
    return value.message;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  try {
    return JSON.stringify(value) || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
