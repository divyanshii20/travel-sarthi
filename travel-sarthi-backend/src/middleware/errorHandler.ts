import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors';
import { sendError } from '../shared/response';
import { logger } from '../shared/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      details[path] = details[path] ?? [];
      details[path].push(issue.message);
    }
    sendError(res, 422, 'VALIDATION_ERROR', 'Request validation failed', details);
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, reqId: req.headers['x-request-id'] }, 'Non-operational AppError');
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Unknown / programming error
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
}
