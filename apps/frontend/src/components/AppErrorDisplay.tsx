import { Button } from '@jtl-software/platform-ui-react';
import type { AppErrorDetails } from '../services/appError';
import { useAppErrors, type ErrorHistoryEntry } from '../services/appErrorContext';

function AppErrorDisplay() {
  const { errors, activeToastIds, isDrawerOpen, selectedErrorId, clearErrors, openDrawer, closeDrawer, selectError } = useAppErrors();
  const activeToasts = activeToastIds.map(id => errors.find(error => error.id === id)).filter((error): error is ErrorHistoryEntry => error != null);
  const selectedError: ErrorHistoryEntry | null = errors.find(error => error.id === selectedErrorId) ?? errors[0] ?? null;

  return (
    <>
      <div className="app-toast-stack" aria-live="polite" aria-atomic="true">
        {activeToasts.map(error => (
          <div key={error.id} className="app-toast">
            <div className="app-toast__copy">
              <p className="app-toast__title">{error.userMessage}</p>
              <p className="app-toast__meta">{formatErrorMeta(error.source, error.status, error.code)}</p>
            </div>
            <button type="button" className="app-toast__action" onClick={() => openDrawer(error.id)}>
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
          onClick={() => openDrawer()}
        />
      </div>
      {isDrawerOpen ? (
        <div className="app-drawer-backdrop" role="presentation" onClick={closeDrawer}>
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
                <button type="button" className="app-drawer__secondary-action" onClick={clearErrors} disabled={!errors.length}>
                  Clear all
                </button>
                <button type="button" className="app-drawer__secondary-action" onClick={closeDrawer}>
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
                      onClick={() => selectError(error.id)}
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
                          {selectedError.validationErrors.map((issue: AppErrorDetails['validationErrors'][number]) => (
                            <div key={`${issue.field ?? 'global'}-${issue.messages.join('|')}`} className="app-validation-issue">
                              <p className="app-validation-issue__field">{issue.field ?? 'General'}</p>
                              <ul className="app-validation-issue__list">
                                {issue.messages.map((message: string) => (
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
    </>
  );
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

export default AppErrorDisplay;
