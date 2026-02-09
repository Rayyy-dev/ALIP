import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';

// String constants for log levels (SQLite compatibility)
export const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

/**
 * Log data access layer
 * Handles all database operations for log entries
 */
class LogRepository {
  /**
   * Create a new log entry
   */
  async create(data: {
    timestamp: Date;
    level: string;
    service: string;
    message: string;
    normalizedMessage: string;
    stackTrace?: string;
    fingerprint: string;
  }) {
    return prisma.log.create({
      data: {
        timestamp: data.timestamp,
        level: data.level,
        service: data.service,
        message: data.message,
        normalizedMessage: data.normalizedMessage,
        stackTrace: data.stackTrace,
        fingerprint: data.fingerprint,
      },
    });
  }

  /**
   * Link a log to an error group
   */
  async linkToErrorGroup(logId: string, errorGroupId: string) {
    return prisma.log.update({
      where: { id: logId },
      data: { errorGroupId },
    });
  }

  /**
   * Find log by ID
   */
  async findById(id: string) {
    return prisma.log.findUnique({
      where: { id },
      include: {
        errorGroup: true,
      },
    });
  }

  /**
   * Find logs with filtering and pagination
   */
  async findMany(
    where: Prisma.LogWhereInput,
    page: number = 1,
    limit: number = config.defaultPageSize
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          errorGroup: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.log.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get log statistics for a time period
   */
  async getStats(
    startDate: Date,
    endDate: Date,
    service?: string
  ): Promise<{
    total: number;
    infoCount: number;
    warnCount: number;
    errorCount: number;
  }> {
    const where: Prisma.LogWhereInput = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (service) {
      where.service = service;
    }

    const [total, infoCount, warnCount, errorCount] = await Promise.all([
      prisma.log.count({ where }),
      prisma.log.count({ where: { ...where, level: LogLevel.INFO } }),
      prisma.log.count({ where: { ...where, level: LogLevel.WARN } }),
      prisma.log.count({ where: { ...where, level: LogLevel.ERROR } }),
    ]);

    return { total, infoCount, warnCount, errorCount };
  }

  /**
   * Get distinct services in a time range
   */
  async getDistinctServices(startDate: Date, endDate: Date): Promise<string[]> {
    const result = await prisma.log.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      distinct: ['service'],
      select: { service: true },
    });

    return result.map((r) => r.service);
  }

  /**
   * Get all unique service names
   */
  async getAllServices(): Promise<string[]> {
    const result = await prisma.log.findMany({
      distinct: ['service'],
      select: { service: true },
      orderBy: { service: 'asc' },
    });

    return result.map((r) => r.service);
  }

  /**
   * Count logs by fingerprint in a time range
   */
  async countByFingerprint(
    fingerprint: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return prisma.log.count({
      where: {
        fingerprint,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get logs for an error group
   */
  async findByErrorGroup(
    errorGroupId: string,
    limit: number = 10
  ) {
    return prisma.log.findMany({
      where: { errorGroupId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Delete logs older than a certain date
   * Used for data retention
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.log.deleteMany({
      where: {
        timestamp: {
          lt: date,
        },
      },
    });

    return result.count;
  }
}

export const logRepository = new LogRepository();
