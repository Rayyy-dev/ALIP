import { LogInput, BatchLogInput, LogQueryParams, LogStats } from '@alip/shared-types';
import { logRepository, LogLevel } from '../repositories/log.repository';
import { errorGroupService } from './error-grouping.service';
import { trendService } from './trend.service';
import { alertService } from './alert.service';
import { normalizeMessage, generateFingerprint } from './normalization.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

/**
 * Zod schema for log input validation
 */
const logInputSchema = z.object({
  timestamp: z.string().datetime({ message: 'Invalid ISO 8601 timestamp' }),
  level: z.enum(['INFO', 'WARN', 'ERROR']),
  service: z.string().min(1, 'Service name is required').max(100),
  message: z.string().min(1, 'Message is required').max(10000),
  stackTrace: z.string().max(50000).optional(),
});

const batchLogInputSchema = z.object({
  logs: z.array(logInputSchema).min(1).max(1000),
});

/**
 * Log ingestion and query service
 */
class LogService {
  /**
   * Ingest a single log entry
   * Normalizes the message, generates fingerprint, and updates related entities
   */
  async ingestLog(input: LogInput) {
    // Validate input
    const validated = logInputSchema.parse(input);

    // Normalize message and generate fingerprint
    const normalizedMsg = normalizeMessage(validated.message);
    const fingerprint = generateFingerprint(
      normalizedMsg,
      validated.service,
      validated.level
    );

    // Create log entry
    const log = await logRepository.create({
      timestamp: new Date(validated.timestamp),
      level: validated.level,
      service: validated.service,
      message: validated.message,
      normalizedMessage: normalizedMsg,
      stackTrace: validated.stackTrace,
      fingerprint,
    });

    // Update error group (for WARN and ERROR levels)
    if (validated.level !== 'INFO') {
      const errorGroup = await errorGroupService.updateOrCreateGroup(
        fingerprint,
        normalizedMsg,
        validated.service,
        validated.level,
        new Date(validated.timestamp)
      );

      // Link log to error group
      await logRepository.linkToErrorGroup(log.id, errorGroup.id);
    }

    // Schedule trend update and alert evaluation (async, non-blocking)
    this.scheduleBackgroundTasks(validated.service, validated.level);

    logger.debug('Log ingested', { logId: log.id, fingerprint });

    return log;
  }

  /**
   * Ingest multiple logs in batch
   * Processes logs in parallel for efficiency
   */
  async ingestBatch(input: BatchLogInput) {
    // Validate batch input
    const validated = batchLogInputSchema.parse(input);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process logs in chunks to avoid overwhelming the database
    const chunkSize = 100;
    for (let i = 0; i < validated.logs.length; i += chunkSize) {
      const chunk = validated.logs.slice(i, i + chunkSize);

      const results = await Promise.allSettled(
        chunk.map((log) => this.ingestLog(log))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processed++;
        } else {
          failed++;
          errors.push(`Log ${i + index}: ${result.reason.message}`);
        }
      });
    }

    logger.info('Batch ingestion complete', { processed, failed });

    return { processed, failed, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * Query logs with filtering and pagination
   */
  async queryLogs(params: LogQueryParams) {
    const where: Record<string, unknown> = {};

    if (params.level) {
      where.level = params.level;
    }

    if (params.service) {
      where.service = params.service;
    }

    if (params.errorGroupId) {
      where.errorGroupId = params.errorGroupId;
    }

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        (where.timestamp as Record<string, Date>).gte = new Date(params.startDate);
      }
      if (params.endDate) {
        (where.timestamp as Record<string, Date>).lte = new Date(params.endDate);
      }
    }

    if (params.search) {
      where.message = { contains: params.search };
    }

    return logRepository.findMany(where, params.page, params.limit);
  }

  /**
   * Get log by ID
   */
  async getLogById(id: string) {
    return logRepository.findById(id);
  }

  /**
   * Get log statistics for a time period
   */
  async getStats(startDate?: string, endDate?: string): Promise<LogStats> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await logRepository.getStats(start, end);
    const services = await logRepository.getDistinctServices(start, end);

    return {
      total: stats.total,
      infoCount: stats.infoCount,
      warnCount: stats.warnCount,
      errorCount: stats.errorCount,
      errorRate: stats.total > 0 ? (stats.errorCount / stats.total) * 100 : 0,
      services,
    };
  }

  /**
   * Get all unique service names
   */
  async getServices(): Promise<string[]> {
    return logRepository.getAllServices();
  }

  /**
   * Schedule background tasks after log ingestion
   * These run asynchronously to not block the API response
   */
  private scheduleBackgroundTasks(service: string, level: string): void {
    // Update trends (fire and forget)
    setImmediate(async () => {
      try {
        await trendService.updateTrendsForLog(service, level);
      } catch (err) {
        logger.error('Failed to update trends', { error: (err as Error).message });
      }
    });

    // Evaluate alerts (fire and forget)
    setImmediate(async () => {
      try {
        await alertService.evaluateAlerts(service);
      } catch (err) {
        logger.error('Failed to evaluate alerts', { error: (err as Error).message });
      }
    });
  }
}

export const logService = new LogService();
