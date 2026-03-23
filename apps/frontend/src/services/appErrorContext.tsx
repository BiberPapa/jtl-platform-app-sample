import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorFingerprint, isAppError, toAppError, type AppErrorDetails, type AppErrorFallback } from './appError';

export type ErrorHistoryEntry = AppErrorDetails & {
  id: string;
};

type AppErrorContextValue = {
  errors: ErrorHistoryEntry[];
  activeToastIds: string[];
  isDrawerOpen: boolean;
  selectedErrorId: string | null;
  reportError: (error: unknown, fallback?: AppErrorFallback) => ErrorHistoryEntry;
  dismissError: (id: string) => void;
  clearErrors: () => void;
  openDrawer: (id?: string | null) => void;
  closeDrawer: () => void;
  selectError: (id: string | null) => void;
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
      activeToastIds,
      isDrawerOpen,
      selectedErrorId,
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
      openDrawer: (id?: string | null) => {
        setIsDrawerOpen(true);
        setSelectedErrorId(currentValue => id ?? currentValue ?? errors[0]?.id ?? null);
      },
      closeDrawer: () => {
        setIsDrawerOpen(false);
      },
      selectError: (id: string | null) => {
        setSelectedErrorId(id);
      },
    }),
    [activeToastIds, errors, isDrawerOpen, selectedErrorId],
  );

  return <AppErrorContext.Provider value={contextValue}>{children}</AppErrorContext.Provider>;
}

export function useAppErrors(): AppErrorContextValue {
  const contextValue = useContext(AppErrorContext);

  if (!contextValue) {
    throw new Error('Expected the app error context to be available.');
  }

  return contextValue;
}
