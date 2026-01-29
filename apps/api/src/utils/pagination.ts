import { config } from '../config';

/**
 * Pagination utilities for consistent paging across all endpoints
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parse and validate pagination parameters from query string
 */
export function parsePaginationParams(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const rawLimit = parseInt(String(query.limit || config.defaultPageSize), 10) || config.defaultPageSize;
  const limit = Math.min(Math.max(1, rawLimit), config.maxPageSize);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Calculate pagination metadata from results
 */
export function calculatePaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  const totalPages = Math.ceil(total / params.limit);

  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

/**
 * Create a paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
) {
  return {
    success: true,
    data,
    pagination: calculatePaginationMeta(total, params),
    timestamp: new Date().toISOString(),
  };
}
