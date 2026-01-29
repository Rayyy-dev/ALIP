/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

/**
 * Error response structure
 */
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

/**
 * Log ingestion response
 */
export interface LogIngestionResponse {
  processed: number;
  failed: number;
  errors?: string[];
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  database: {
    connected: boolean;
    latencyMs?: number;
  };
}
