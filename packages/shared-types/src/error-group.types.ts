import { LogLevel, Log } from './log.types';

/**
 * Error group status enumeration
 */
export enum ErrorGroupStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

/**
 * Error group entity representing a unique error pattern
 */
export interface ErrorGroup {
  id: string;
  fingerprint: string;
  normalizedMessage: string;
  service: string;
  level: LogLevel;
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  status: ErrorGroupStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Error group with sample logs for detailed view
 */
export interface ErrorGroupWithLogs extends ErrorGroup {
  logs: Log[];
}

/**
 * Error group query parameters
 */
export interface ErrorGroupQueryParams {
  page?: number;
  limit?: number;
  status?: ErrorGroupStatus;
  service?: string;
  level?: LogLevel;
  sortBy?: 'occurrenceCount' | 'lastSeen' | 'firstSeen';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Error group update input
 */
export interface ErrorGroupUpdateInput {
  status?: ErrorGroupStatus;
}

/**
 * Summary of error groups for dashboard
 */
export interface ErrorGroupSummary {
  id: string;
  normalizedMessage: string;
  service: string;
  level: LogLevel;
  occurrenceCount: number;
  lastSeen: Date;
  status: ErrorGroupStatus;
}
