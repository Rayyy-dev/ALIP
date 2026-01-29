/**
 * Log Level enumeration
 * Represents the severity level of a log entry
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Raw log input from external sources
 * This is the shape of data received from the API
 */
export interface LogInput {
  timestamp: string; // ISO 8601 format
  level: LogLevel;
  service: string;
  message: string;
  stackTrace?: string;
}

/**
 * Batch log input for bulk ingestion
 */
export interface BatchLogInput {
  logs: LogInput[];
}

/**
 * Stored log entity with all computed fields
 */
export interface Log {
  id: string;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  normalizedMessage: string;
  stackTrace: string | null;
  fingerprint: string;
  errorGroupId: string | null;
  createdAt: Date;
}

/**
 * Log query parameters for filtering and pagination
 */
export interface LogQueryParams {
  page?: number;
  limit?: number;
  level?: LogLevel;
  service?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  errorGroupId?: string;
}

/**
 * Log statistics for a time period
 */
export interface LogStats {
  total: number;
  infoCount: number;
  warnCount: number;
  errorCount: number;
  errorRate: number; // Percentage of errors
  services: string[];
}
