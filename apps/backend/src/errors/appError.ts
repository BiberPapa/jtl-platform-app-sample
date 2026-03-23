export type AppErrorOptions = {
  cause?: unknown;
  code: string;
  publicMessage?: string;
  statusCode: number;
};

export class AppError extends Error {
  public override readonly cause: unknown;
  public readonly code: string;
  public override readonly name: string;
  public readonly publicMessage: string;
  public readonly statusCode: number;

  public constructor(message: string, options: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.cause = options.cause;
    this.code = options.code;
    this.publicMessage = options.publicMessage ?? message;
    this.statusCode = options.statusCode;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
