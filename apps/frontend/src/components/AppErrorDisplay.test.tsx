import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppErrorDisplay from './AppErrorDisplay';
import { type AppError, AppError as AppErrorClass } from '../services/appError';
import { AppErrorProvider, useAppErrors } from '../services/appErrorContext';

vi.mock('@jtl-software/platform-ui-react', () => ({
  Button: ({
    label,
    onClick,
    type,
    disabled,
    'aria-label': ariaLabel,
  }: {
    label?: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    'aria-label'?: string;
  }) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {label}
    </button>
  ),
}));

function ErrorHarness() {
  const { reportError, dismissError } = useAppErrors();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reportError(
            createTestAppError({
              userMessage: 'Primary user error',
              technicalMessage: 'Primary technical error',
              requestPath: '/primary',
            }),
          );
        }}
      >
        Report primary
      </button>
      <button
        type="button"
        onClick={() => {
          reportError(
            createTestAppError({
              userMessage: 'Primary user error',
              technicalMessage: 'Primary technical error',
              requestPath: '/primary',
            }),
          );
        }}
      >
        Report duplicate
      </button>
      <button
        type="button"
        onClick={() => {
          const entry = reportError(
            createTestAppError({
              userMessage: 'Dismiss me',
              technicalMessage: 'Dismiss technical message',
              requestPath: '/dismiss',
            }),
          );
          dismissError(entry.id);
        }}
      >
        Report then dismiss
      </button>
    </>
  );
}

describe('AppErrorDisplay', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deduplicates repeated errors and renders their details through the extracted UI', async () => {
    const user = userEvent.setup();

    render(
      <AppErrorProvider>
        <ErrorHarness />
        <AppErrorDisplay />
      </AppErrorProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Report primary' }));
    await user.click(screen.getByRole('button', { name: 'Report duplicate' }));

    expect(screen.getByRole('button', { name: 'Open error history (1 error)' })).toBeInTheDocument();
    expect(screen.getByText('Primary user error')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open error history (1 error)' }));

    expect(screen.getByRole('dialog', { name: 'Error history' })).toBeInTheDocument();
    expect(screen.getByText('Primary technical error')).toBeInTheDocument();
    expect(screen.getAllByText(/\/primary/)).not.toHaveLength(0);
  });

  it('supports dismissing and clearing errors while the UI stays in sync', async () => {
    const user = userEvent.setup();

    render(
      <AppErrorProvider>
        <ErrorHarness />
        <AppErrorDisplay />
      </AppErrorProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Report then dismiss' }));

    expect(screen.getByRole('button', { name: 'Open error history (0 errors)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Report primary' }));
    await user.click(screen.getByRole('button', { name: 'Open error history (1 error)' }));
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(screen.getByText('No errors have been recorded in this session.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open error history (0 errors)' })).toBeInTheDocument();
  });

  it('removes toast entries after the configured timeout', () => {
    vi.useFakeTimers();

    render(
      <AppErrorProvider>
        <ErrorHarness />
        <AppErrorDisplay />
      </AppErrorProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'Report primary' }).click();
    });
    expect(screen.getByText('Primary user error')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('Primary user error')).not.toBeInTheDocument();
  });
});

function createTestAppError(input: { userMessage: string; technicalMessage: string; requestPath: string }): AppError {
  return new AppErrorClass({
    kind: 'unexpected',
    source: 'unknown',
    code: 'TEST_ERROR',
    userMessage: input.userMessage,
    technicalMessage: input.technicalMessage,
    validationErrors: [],
    status: null,
    timestamp: new Date().toISOString(),
    requestPath: input.requestPath,
    raw: { requestPath: input.requestPath },
  });
}
