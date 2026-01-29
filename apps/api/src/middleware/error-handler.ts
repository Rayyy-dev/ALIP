import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(error.message);
    });

    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
    return;
  }

  // Handle custom validation errors
  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };

    switch (prismaError.code) {
      case 'P2002':
        sendError(
          res,
          `Unique constraint violation on ${prismaError.meta?.target?.join(', ')}`,
          409,
          'CONFLICT'
        );
        return;
      case 'P2025':
        sendError(res, 'Record not found', 404, 'NOT_FOUND');
        return;
      default:
        sendError(res, 'Database error', 500, 'DATABASE_ERROR');
        return;
    }
  }

  // Handle unknown errors (don't leak internal details in production)
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  sendError(res, message, 500, 'INTERNAL_ERROR');
}

/**
 * Not found handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
}
