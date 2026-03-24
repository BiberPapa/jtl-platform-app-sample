import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppLogger, ProcessRuntime } from './serverLifecycle.js';
import { logServerStarted, logServerStarting, registerServerLifecycle } from './serverLifecycle.js';

class TestRuntime extends EventEmitter implements ProcessRuntime {
  pid = 4242;

  exit = vi.fn((code?: number): never => {
    throw new Error(`exit:${code ?? 0}`);
  });
}

function createLogger(): {
  errorMock: ReturnType<typeof vi.fn<(object: Record<string, unknown>, message: string) => void>>;
  infoMock: ReturnType<typeof vi.fn<(object: Record<string, unknown>, message: string) => void>>;
  logger: AppLogger;
} {
  const errorMock = vi.fn<(object: Record<string, unknown>, message: string) => void>();
  const infoMock = vi.fn<(object: Record<string, unknown>, message: string) => void>();

  return {
    errorMock,
    infoMock,
    logger: {
      error: (object, message) => {
        errorMock(object, message);
      },
      info: (object, message) => {
        infoMock(object, message);
      },
    },
  };
}

function createServer(closeImplementation?: (callback: (error?: Error) => void) => void): {
  closeMock: ReturnType<typeof vi.fn>;
  server: Server;
} {
  const closeMock = vi.fn((callback: (error?: Error) => void) => {
    if (closeImplementation) {
      closeImplementation(callback);
      return {} as Server;
    }

    callback();
    return {} as Server;
  });

  return {
    closeMock,
    server: {
      close: closeMock,
    } as unknown as Server,
  };
}

describe('serverLifecycle', () => {
  beforeEach(() => {
    delete process.env.ERP_PROXY_LOG_LEVEL;
    delete process.env.DEBUG_ERP_PROXY;
    delete process.env.NODE_ENV;
  });

  it('logs startup and started events with port and pid', () => {
    const { infoMock, logger } = createLogger();

    logServerStarting(6143, logger, 4242);
    logServerStarted(6143, logger, 4242);

    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        event: 'server_starting',
        pid: 4242,
        port: 6143,
        proxyLogLevel: 'basic',
      }),
      'Starting server on http://localhost:6143',
    );
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        event: 'server_started',
        pid: 4242,
        port: 6143,
        proxyLogLevel: 'basic',
      }),
      'Server running on http://localhost:6143',
    );
  });

  it('logs stopping and stopped events with exit code on SIGINT', () => {
    const { infoMock, logger } = createLogger();
    const runtime = new TestRuntime();
    const { closeMock, server } = createServer();

    registerServerLifecycle(server, logger, runtime);

    expect(() => runtime.emit('SIGINT')).toThrow('exit:0');

    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'server_stopping',
        exitCode: 0,
        pid: 4242,
        reason: 'SIGINT',
      }),
      'Stopping server (SIGINT)',
    );
    expect(infoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'server_stopped',
        exitCode: 0,
        pid: 4242,
        reason: 'SIGINT',
      }),
      'Server stopped (SIGINT)',
    );
  });

  it('logs uncaught exceptions with exit code 1 before shutdown', () => {
    const { errorMock, infoMock, logger } = createLogger();
    const runtime = new TestRuntime();
    const { server } = createServer();
    const error = new Error('boom');

    registerServerLifecycle(server, logger, runtime);

    expect(() => runtime.emit('uncaughtException', error)).toThrow('exit:1');

    expect(errorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'Error',
        err: error,
        event: 'server_uncaught_exception',
        exitCode: 1,
        pid: 4242,
      }),
      'Unhandled exception during backend runtime',
    );
    expect(infoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'server_stopping',
        exitCode: 1,
        pid: 4242,
        reason: 'uncaughtException',
      }),
      'Stopping server (uncaughtException)',
    );
  });
});
