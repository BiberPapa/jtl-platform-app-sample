import { describe, expect, it } from 'vitest';
import { AppError, createAppErrorFromBackendResponse, createGraphQlAppError, toAppError } from './appError';

describe('appError helpers', () => {
  it('normalizes ASP.NET backend errors with validation issues', () => {
    const error = createAppErrorFromBackendResponse(
      {
        status: 400,
        text: JSON.stringify({
          ErrorCode: 'ValidationFailed',
          Errors: {
            Name: ['Name is required.'],
          },
          ValidationErrors: {
            LegacyField: 'Legacy validation message.',
          },
          ErrorMessage: 'Validation failed on the backend.',
        }),
        json: {
          ErrorCode: 'ValidationFailed',
          Errors: {
            Name: ['Name is required.'],
          },
          ValidationErrors: {
            LegacyField: 'Legacy validation message.',
          },
          ErrorMessage: 'Validation failed on the backend.',
        },
      },
      {
        source: 'erp',
        requestPath: '/erp/v1/customers',
        fallbackMessage: 'The ERP request could not be completed.',
      },
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error.details).toMatchObject({
      kind: 'backend',
      source: 'erp',
      code: 'ValidationFailed',
      userMessage: 'Some of the provided data could not be validated.',
      technicalMessage: 'Validation failed on the backend.',
      status: 400,
      requestPath: '/erp/v1/customers',
    });
    expect(error.details.validationErrors).toEqual([
      {
        field: 'Name',
        messages: ['Name is required.'],
      },
      {
        field: 'LegacyField',
        messages: ['Legacy validation message.'],
      },
    ]);
  });

  it('keeps friendly user messaging for unknown backend exceptions', () => {
    const error = createAppErrorFromBackendResponse(
      {
        status: 500,
        text: '',
        json: {
          ErrorCode: 'Unknown',
          ErrorMessage: 'ExecuteReader requires an open connection.',
        },
      },
      {
        source: 'graphql',
        requestPath: '/graphql',
        fallbackMessage: 'The GraphQL request could not be completed.',
      },
    );

    expect(error.details.userMessage).toBe('The GraphQL request could not be completed.');
    expect(error.details.technicalMessage).toBe('ExecuteReader requires an open connection.');
  });

  it('normalizes GraphQL errors from successful HTTP responses', () => {
    const error = createGraphQlAppError(
      [
        {
          message: 'Viewer field failed.',
          path: ['viewer'],
          extensions: {
            code: 'GRAPHQL_VALIDATION_FAILED',
          },
        },
      ],
      {
        source: 'graphql',
        requestPath: '/graphql',
        fallbackMessage: 'The GraphQL request could not be completed.',
      },
    );

    expect(error.details).toMatchObject({
      kind: 'graphql',
      code: 'GRAPHQL_VALIDATION_FAILED',
      userMessage: 'The GraphQL request could not be completed.',
      technicalMessage: 'Viewer field failed.',
    });
    expect(error.details.validationErrors).toEqual([
      {
        field: 'viewer',
        messages: ['Viewer field failed.'],
      },
    ]);
  });

  it('maps fetch failures to network errors', () => {
    const error = toAppError(new TypeError('Failed to fetch'), {
      source: 'app-info',
      requestPath: '/app-info',
      fallbackMessage: 'The backend app info could not be loaded.',
    });

    expect(error.details).toMatchObject({
      kind: 'network',
      code: 'NETWORK_ERROR',
      userMessage: 'The backend app info could not be loaded.',
      technicalMessage: 'Failed to fetch',
    });
  });

  it('falls back to unexpected errors for unsupported payloads', () => {
    const error = toAppError(
      { invalid: true },
      {
        source: 'unknown',
        fallbackMessage: 'An unexpected error occurred.',
      },
    );

    expect(error.details.kind).toBe('unexpected');
    expect(error.details.userMessage).toBe('An unexpected error occurred.');
  });
});
