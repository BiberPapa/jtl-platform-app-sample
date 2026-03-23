import { Button } from '@jtl-software/platform-ui-react';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { type AppErrorDetails, getErrorFingerprint, isAppError, toAppError, type AppErrorFallback } from './appError';

type ErrorHistoryEntry = AppErrorDetails & {
  id: string;
};

type AppErrorContextValue = {
  errors: ErrorHistoryEntry[];
  reportError: (error: unknown, fallback?: AppErrorFallback) => ErrorHistoryEntry;
  dismissError: (id: string) => void;
  clearErrors: () => void;
};

const AppErrorContext = createContext<AppErrorContextValue | null>(null);

type AppErrorProviderProps = {
  children: ReactNode;
};

const TOAST_LIFETIME_MS = 6000;
const DEDUPE_WINDOW_MS = 5000;

export function AppErrorProvider({ children }: AppErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorHistoryEntry[]>([]);
  const [activeToastIds, setActiveToastIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const errorCounterRef = useRef(0);

  useEffect(() => {
    return () => {
      for (const timerId of toastTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }

      toastTimersRef.current.clear();
    };
  }, []);

  const contextValue = useMemo<AppErrorContextValue>(
    () => ({
      errors,
      reportError: (error: unknown, fallback?: AppErrorFallback): ErrorHistoryEntry => {
        const nextError = isAppError(error)
          ? error
          : toAppError(
              error,
              fallback ?? {
                source: 'unknown',
                fallbackMessage: 'An unexpected error occurred.',
              },
            );
        const fingerprint = getErrorFingerprint(nextError.details);
        const now = Date.now();
        const existingError = errors.find(entry => {
          const entryTimestamp = Date.parse(entry.timestamp);

          return getErrorFingerprint(entry) === fingerprint && Number.isFinite(entryTimestamp) && now - entryTimestamp < DEDUPE_WINDOW_MS;
        });

        if (existingError) {
          setSelectedErrorId(currentValue => currentValue ?? existingError.id);
          return existingError;
        }

        const entry: ErrorHistoryEntry = {
          ...nextError.details,
          id: `app-error-${++errorCounterRef.current}`,
        };

        setErrors(currentValue => [entry, ...currentValue].slice(0, 50));
        setSelectedErrorId(currentValue => currentValue ?? entry.id);
        setActiveToastIds(currentValue => [entry.id, ...currentValue].slice(0, 5));
        const timerId = window.setTimeout(() => {
          setActiveToastIds(currentValue => currentValue.filter(id => id !== entry.id));
          toastTimersRef.current.delete(entry.id);
        }, TOAST_LIFETIME_MS);

        toastTimersRef.current.set(entry.id, timerId);

        return entry;
      },
      dismissError: (id: string) => {
        const timerId = toastTimersRef.current.get(id);

        if (timerId != null) {
          window.clearTimeout(timerId);
          toastTimersRef.current.delete(id);
        }

        setActiveToastIds(currentValue => currentValue.filter(entryId => entryId !== id));
        setErrors(currentValue => currentValue.filter(error => error.id !== id));
        setSelectedErrorId(currentValue => (currentValue === id ? null : currentValue));
      },
      clearErrors: () => {
        for (const timerId of toastTimersRef.current.values()) {
          window.clearTimeout(timerId);
        }

        toastTimersRef.current.clear();
        setActiveToastIds([]);
        setErrors([]);
        setSelectedErrorId(null);
      },
    }),
    [errors],
  );

  const activeToasts = activeToastIds
    .map(id => errors.find(error => error.id === id) ?? null)
    .filter((error): error is ErrorHistoryEntry => Boolean(error));
  const selectedError = errors.find(error => error.id === selectedErrorId) ?? errors[0] ?? null;

  return (
    <AppErrorContext.Provider value={contextValue}>
      {children}
      <div className="app-toast-stack" aria-live="polite" aria-atomic="true">
        {activeToasts.map(error => (
          <div key={error.id} className="app-toast">
            <div className="app-toast__copy">
              <p className="app-toast__title">{error.userMessage}</p>
              <p className="app-toast__meta">{formatErrorMeta(error.source, error.status, error.code)}</p>
            </div>
            <button type="button" className="app-toast__action" onClick={() => setIsDrawerOpen(true)}>
              Details
            </button>
          </div>
        ))}
      </div>
      <div className="app-error-history-trigger">
        <Button
          type="button"
          variant="destructive"
          size="xs"
          icon="AlertTriangle"
          label={String(errors.length)}
          aria-label={`Open error history (${formatErrorCount(errors.length)})`}
          onClick={() => {
            setIsDrawerOpen(true);
            setSelectedErrorId(currentValue => currentValue ?? errors[0]?.id ?? null);
          }}
        />
      </div>
      {isDrawerOpen ? (
        <div className="app-drawer-backdrop" role="presentation" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="app-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-error-history-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="app-drawer__header">
              <div className="app-section-grid">
                <h2 id="app-error-history-title" className="app-modal-title">
                  Error history
                </h2>
                <p className="app-muted-text">Recent frontend API errors for the current session.</p>
              </div>
              <div className="app-button-row">
                <button type="button" className="app-drawer__secondary-action" onClick={() => contextValue.clearErrors()} disabled={!errors.length}>
                  Clear all
                </button>
                <button type="button" className="app-drawer__secondary-action" onClick={() => setIsDrawerOpen(false)}>
                  Close
                </button>
              </div>
            </div>
            <div className="app-drawer__body">
              <div className="app-error-history-list">
                {errors.length ? (
                  errors.map(error => (
                    <button
                      key={error.id}
                      type="button"
                      className={`app-error-history-item${selectedError?.id === error.id ? ' app-error-history-item--active' : ''}`}
                      onClick={() => setSelectedErrorId(error.id)}
                    >
                      <p className="app-error-history-item__title">{error.userMessage}</p>
                      <p className="app-error-history-item__meta">{formatHistoryMeta(error)}</p>
                    </button>
                  ))
                ) : (
                  <p className="app-muted-text">No errors have been recorded in this session.</p>
                )}
              </div>
              <div className="app-error-detail">
                {selectedError ? (
                  <>
                    <div className="app-section-grid">
                      <p className="app-metric-label">Summary</p>
                      <p className="app-metric-value">{selectedError.userMessage}</p>
                      <p className="app-muted-text">{formatHistoryMeta(selectedError)}</p>
                    </div>
                    <div className="app-section-grid">
                      <p className="app-metric-label">Technical message</p>
                      <pre className="app-code-block">{selectedError.technicalMessage}</pre>
                    </div>
                    {selectedError.validationErrors.length ? (
                      <div className="app-section-grid">
                        <p className="app-metric-label">Validation details</p>
                        <div className="app-section-grid">
                          {selectedError.validationErrors.map(issue => (
                            <div key={`${issue.field ?? 'global'}-${issue.messages.join('|')}`} className="app-validation-issue">
                              <p className="app-validation-issue__field">{issue.field ?? 'General'}</p>
                              <ul className="app-validation-issue__list">
                                {issue.messages.map(message => (
                                  <li key={message}>{message}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="app-section-grid">
                      <p className="app-metric-label">Raw payload</p>
                      <pre className="app-code-block">{formatRawErrorPayload(selectedError.raw)}</pre>
                    </div>
                  </>
                ) : (
                  <p className="app-muted-text">Select an error entry to inspect its details.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </AppErrorContext.Provider>
  );
}

export function useAppErrors(): AppErrorContextValue {
  const contextValue = useContext(AppErrorContext);

  if (!contextValue) {
    throw new Error('Expected the app error context to be available.');
  }

  return contextValue;
}

function formatErrorMeta(source: AppErrorDetails['source'], status: number | null, code: string): string {
  return `${source.toUpperCase()}${status ? ` • HTTP ${status}` : ''} • ${code}`;
}

function formatHistoryMeta(error: ErrorHistoryEntry): string {
  return `${error.timestamp}${error.requestPath ? ` • ${error.requestPath}` : ''} • ${formatErrorMeta(error.source, error.status, error.code)}`;
}

function formatRawErrorPayload(raw: unknown): string {
  try {
    return JSON.stringify(raw, null, 2) || 'null';
  } catch {
    return String(raw);
  }
}

function formatErrorCount(count: number): string {
  return `${count} error${count === 1 ? '' : 's'}`;
}
