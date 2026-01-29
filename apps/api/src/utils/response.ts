import { Response } from 'express';
import { ApiResponse, ApiError } from '@alip/shared-types';

/**
 * Standardized API response utilities
 */

/**
 * Send a successful response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, string[]>
): void {
  const response: ApiError = {
    success: false,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}
