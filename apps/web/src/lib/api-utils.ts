import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ValidationError } from './errors';
import { logger } from './logger';

// --- Response Helpers ---

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

export function errorResponse(
  message: string,
  status = 500,
  code?: string,
  details?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code, details, timestamp: new Date().toISOString() },
    { status }
  );
}

export function createdResponse<T>(data: T): NextResponse {
  return successResponse(data, 201);
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): NextResponse {
  const totalPages = Math.ceil(total / params.limit);
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
    timestamp: new Date().toISOString(),
  });
}

// --- Pagination ---

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
  const limit = Math.min(Math.max(1, rawLimit), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// --- Error Handling Wrapper ---

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (err) {
      logger.error('Request error', {
        error: (err as Error).message,
        path: req.nextUrl.pathname,
        method: req.method,
      });

      if (err instanceof ZodError) {
        const details: Record<string, string[]> = {};
        err.errors.forEach((e) => {
          const path = e.path.join('.');
          if (!details[path]) details[path] = [];
          details[path].push(e.message);
        });
        return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', details);
      }

      if (err instanceof ValidationError) {
        return errorResponse(err.message, err.statusCode, err.code, err.details);
      }

      if (err instanceof AppError) {
        return errorResponse(err.message, err.statusCode, err.code);
      }

      if ((err as { name?: string }).name === 'PrismaClientKnownRequestError') {
        const prismaErr = err as { code: string; meta?: { target?: string[] } };
        switch (prismaErr.code) {
          case 'P2002':
            return errorResponse(
              `Unique constraint violation on ${prismaErr.meta?.target?.join(', ')}`,
              409,
              'CONFLICT'
            );
          case 'P2025':
            return errorResponse('Record not found', 404, 'NOT_FOUND');
          default:
            return errorResponse('Database error', 500, 'DATABASE_ERROR');
        }
      }

      const message =
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : (err as Error).message;
      return errorResponse(message, 500, 'INTERNAL_ERROR');
    }
  };
}
