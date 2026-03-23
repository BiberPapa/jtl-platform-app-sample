import type { Request, RequestHandler, Response } from 'express';
import { isAppError } from '../errors/appError.js';
import { logger } from '../logger.js';
import { getRequestId } from '../middleware/requestContext.js';

type RouteHandler = (req: Request, res: Response) => Promise<void> | void;

type RouteHandlerOptions = {
  errorMessage: string;
  route: string;
};

export function createRouteHandler(options: RouteHandlerOptions, handler: RouteHandler): RequestHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleRouteError(req, res, error, options);
    }
  };
}

function handleRouteError(req: Request, res: Response, error: unknown, options: RouteHandlerOptions): void {
  const requestId = getRequestId(res);
  const statusCode = isAppError(error) ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : String(error);

  if (statusCode >= 500) {
    logger.error(
      {
        event: 'route_error',
        requestId,
        route: options.route,
        method: req.method,
        path: req.originalUrl,
        err: error,
      },
      `${options.errorMessage}.`,
    );
  } else {
    logger.warn(
      {
        event: 'route_error',
        requestId,
        route: options.route,
        method: req.method,
        path: req.originalUrl,
        errorCode: isAppError(error) ? error.code : 'unknown_error',
        message,
      },
      `${options.errorMessage}.`,
    );
  }

  res.status(statusCode).json({
    error: options.errorMessage,
    message,
  });
}
