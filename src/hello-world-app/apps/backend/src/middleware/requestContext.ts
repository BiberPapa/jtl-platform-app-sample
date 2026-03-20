import { randomUUID } from 'node:crypto';
import type { RequestHandler, Response } from 'express';

export const assignRequestContext: RequestHandler = (_req, res, next) => {
  res.locals.requestId = randomUUID();
  next();
};

export function getRequestId(res: Response): string {
  return typeof res.locals.requestId === 'string' ? res.locals.requestId : 'unknown-request-id';
}
