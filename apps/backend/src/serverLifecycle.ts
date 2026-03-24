import type { Server } from 'node:http';
import { getConfiguredProxyLogLevel } from './logger.js';

export interface AppLogger {
  error(object: Record<string, unknown>, message: string): void;
  info(object: Record<string, unknown>, message: string): void;
}

type ShutdownSignal = 'SIGINT' | 'SIGTERM';

type ProcessEventName = ShutdownSignal | 'uncaughtException' | 'unhandledRejection' | 'exit';

export interface ProcessRuntime {
  exit(code?: number): never;
  on(event: ProcessEventName, listener: (...args: unknown[]) => void): this;
  pid: number;
}

export function logServerStarting(port: number, appLogger: AppLogger, pid: number): void {
  appLogger.info(
    {
      event: 'server_starting',
      port,
      pid,
      proxyLogLevel: getConfiguredProxyLogLevel(),
    },
    `Starting server on http://localhost:${port}`,
  );
}

export function logServerStarted(port: number, appLogger: AppLogger, pid: number): void {
  appLogger.info(
    {
      event: 'server_started',
      port,
      pid,
      proxyLogLevel: getConfiguredProxyLogLevel(),
    },
    `Server running on http://localhost:${port}`,
  );
}

export function registerServerLifecycle(server: Server, appLogger: AppLogger, runtime: ProcessRuntime = process): void {
  let isShuttingDown = false;

  const shutdown = (reason: string, exitCode: number) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    appLogger.info(
      {
        event: 'server_stopping',
        exitCode,
        pid: runtime.pid,
        reason,
      },
      `Stopping server (${reason})`,
    );

    server.close((error?: Error) => {
      if (error) {
        appLogger.error(
          {
            code: error.name,
            err: error,
            event: 'server_stop_error',
            exitCode: 1,
            pid: runtime.pid,
            reason,
          },
          `Server stop failed (${reason})`,
        );
        runtime.exit(1);
      }

      appLogger.info(
        {
          event: 'server_stopped',
          exitCode,
          pid: runtime.pid,
          reason,
        },
        `Server stopped (${reason})`,
      );
      runtime.exit(exitCode);
    });
  };

  runtime.on('SIGINT', () => {
    shutdown('SIGINT', 0);
  });

  runtime.on('SIGTERM', () => {
    shutdown('SIGTERM', 0);
  });

  runtime.on('uncaughtException', error => {
    const normalizedError = error instanceof Error ? error : new Error(String(error));

    appLogger.error(
      {
        code: normalizedError.name,
        err: normalizedError,
        event: 'server_uncaught_exception',
        exitCode: 1,
        pid: runtime.pid,
      },
      'Unhandled exception during backend runtime',
    );

    shutdown('uncaughtException', 1);
  });

  runtime.on('unhandledRejection', reason => {
    appLogger.error(
      {
        event: 'server_unhandled_rejection',
        exitCode: 1,
        pid: runtime.pid,
        reason,
      },
      'Unhandled promise rejection during backend runtime',
    );

    shutdown('unhandledRejection', 1);
  });

  runtime.on('exit', code => {
    appLogger.info(
      {
        event: 'process_exit',
        exitCode: typeof code === 'number' ? code : 0,
        pid: runtime.pid,
      },
      'Backend process exiting',
    );
  });
}
