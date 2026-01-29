import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

// String constants for bucket types (SQLite compatibility)
export const BucketType = {
  HOUR: 'HOUR',
  DAY: 'DAY',
} as const;

export type BucketTypeValue = typeof BucketType[keyof typeof BucketType];

/**
 * Trend data access layer
 * Handles aggregated metrics storage
 */
class TrendRepository {
  /**
   * Find a specific trend bucket
   */
  async findBucket(bucketStart: Date, bucketType: string, service: string | null) {
    return prisma.errorTrend.findUnique({
      where: {
        bucketStart_bucketType_service: {
          bucketStart,
          bucketType,
          service: service ?? '',
        },
      },
    });
  }

  /**
   * Upsert a trend bucket with incremented counts
   * Uses atomic operations for concurrent safety
   */
  async upsertBucket(
    bucketStart: Date,
    bucketType: string,
    service: string | null,
    increments: {
      totalLogs?: number;
      infoCount?: number;
      warnCount?: number;
      errorCount?: number;
    }
  ) {
    const serviceValue = service ?? '';

    return prisma.errorTrend.upsert({
      where: {
        bucketStart_bucketType_service: {
          bucketStart,
          bucketType,
          service: serviceValue,
        },
      },
      create: {
        bucketStart,
        bucketType,
        service: serviceValue || null,
        totalLogs: increments.totalLogs || 0,
        infoCount: increments.infoCount || 0,
        warnCount: increments.warnCount || 0,
        errorCount: increments.errorCount || 0,
        errorRate: 0,
      },
      update: {
        totalLogs: { increment: increments.totalLogs || 0 },
        infoCount: { increment: increments.infoCount || 0 },
        warnCount: { increment: increments.warnCount || 0 },
        errorCount: { increment: increments.errorCount || 0 },
      },
    });
  }

  /**
   * Update error rate for a bucket
   */
  async updateErrorRate(id: string, errorRate: number) {
    return prisma.errorTrend.update({
      where: { id },
      data: { errorRate },
    });
  }

  /**
   * Find trends in a date range
   */
  async findTrends(
    startDate: Date,
    endDate: Date,
    bucketType: string,
    service: string | null,
    limit?: number
  ) {
    const where: Prisma.ErrorTrendWhereInput = {
      bucketStart: {
        gte: startDate,
        lte: endDate,
      },
      bucketType,
    };

    // Handle service filter - null means aggregate across all services
    if (service === null) {
      where.OR = [{ service: null }, { service: '' }];
    } else {
      where.service = service;
    }

    return prisma.errorTrend.findMany({
      where,
      orderBy: { bucketStart: 'asc' },
      take: limit,
    });
  }

  /**
   * Get total metrics for a date range
   */
  async getTotals(startDate: Date, endDate: Date, bucketType: string) {
    const result = await prisma.errorTrend.aggregate({
      where: {
        bucketStart: {
          gte: startDate,
          lte: endDate,
        },
        bucketType,
        OR: [{ service: null }, { service: '' }],
      },
      _sum: {
        totalLogs: true,
        infoCount: true,
        warnCount: true,
        errorCount: true,
      },
    });

    return {
      totalLogs: result._sum.totalLogs || 0,
      infoCount: result._sum.infoCount || 0,
      warnCount: result._sum.warnCount || 0,
      errorCount: result._sum.errorCount || 0,
    };
  }

  /**
   * Delete old trend data
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.errorTrend.deleteMany({
      where: {
        bucketStart: { lt: date },
      },
    });

    return result.count;
  }

  /**
   * Get available services in trend data
   */
  async getServices(): Promise<string[]> {
    const result = await prisma.errorTrend.findMany({
      where: {
        NOT: [{ service: null }, { service: '' }],
      },
      distinct: ['service'],
      select: { service: true },
    });

    return result.map((r) => r.service).filter((s): s is string => s !== null);
  }
}

export const trendRepository = new TrendRepository();
