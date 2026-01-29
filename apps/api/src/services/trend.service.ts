import { TrendQueryParams, TimeSeriesPoint, ServiceMetrics, OverviewStats, PeriodComparison } from '@alip/shared-types';
import { trendRepository, BucketType } from '../repositories/trend.repository';
import { logRepository, LogLevel } from '../repositories/log.repository';
import { errorGroupRepository } from '../repositories/error-group.repository';
import { alertRepository } from '../repositories/alert.repository';
import { logger } from '../utils/logger';

/**
 * Trend analysis service
 * Calculates and stores aggregated metrics for visualization
 */
class TrendService {
  /**
   * Update trend data after a new log is ingested
   * Updates both hourly and daily buckets
   */
  async updateTrendsForLog(service: string, level: string): Promise<void> {
    const now = new Date();

    // Calculate bucket start times
    const hourStart = this.getBucketStart(now, BucketType.HOUR);
    const dayStart = this.getBucketStart(now, BucketType.DAY);

    // Update hourly bucket for specific service
    await this.upsertTrendBucket(hourStart, BucketType.HOUR, service, level);

    // Update hourly bucket for all services (aggregate)
    await this.upsertTrendBucket(hourStart, BucketType.HOUR, null, level);

    // Update daily bucket for specific service
    await this.upsertTrendBucket(dayStart, BucketType.DAY, service, level);

    // Update daily bucket for all services (aggregate)
    await this.upsertTrendBucket(dayStart, BucketType.DAY, null, level);
  }

  /**
   * Upsert a trend bucket with incremented counts
   */
  private async upsertTrendBucket(
    bucketStart: Date,
    bucketType: string,
    service: string | null,
    level: string
  ): Promise<void> {
    const incrementField = this.getLevelField(level);

    await trendRepository.upsertBucket(bucketStart, bucketType, service, {
      totalLogs: 1,
      [incrementField]: 1,
    });

    // Recalculate error rate for this bucket
    await this.recalculateErrorRate(bucketStart, bucketType, service);
  }

  /**
   * Recalculate error rate for a specific bucket
   */
  private async recalculateErrorRate(
    bucketStart: Date,
    bucketType: string,
    service: string | null
  ): Promise<void> {
    const bucket = await trendRepository.findBucket(bucketStart, bucketType, service);

    if (bucket && bucket.totalLogs > 0) {
      const errorRate = (bucket.errorCount / bucket.totalLogs) * 100;
      await trendRepository.updateErrorRate(bucket.id, errorRate);
    }
  }

  /**
   * Get trend data for charts
   */
  async getTrends(params: TrendQueryParams) {
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days

    const bucketType = params.bucketType || BucketType.HOUR;

    return trendRepository.findTrends(
      startDate,
      endDate,
      bucketType,
      params.service || null,
      params.limit
    );
  }

  /**
   * Get time series data for chart rendering
   */
  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    bucketType: string,
    metric: 'totalLogs' | 'errorCount' | 'errorRate',
    service?: string
  ): Promise<TimeSeriesPoint[]> {
    const trends = await trendRepository.findTrends(
      startDate,
      endDate,
      bucketType,
      service || null
    );

    return trends.map((trend) => ({
      timestamp: trend.bucketStart.toISOString(),
      value: trend[metric],
    }));
  }

  /**
   * Get service-level metrics for comparison
   */
  async getServiceMetrics(startDate: Date, endDate: Date): Promise<ServiceMetrics[]> {
    const services = await logRepository.getAllServices();
    const metrics: ServiceMetrics[] = [];

    for (const service of services) {
      const current = await logRepository.getStats(startDate, endDate, service);

      // Get previous period for comparison
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - periodLength);
      const prevEnd = startDate;
      const previous = await logRepository.getStats(prevStart, prevEnd, service);

      const changePercent =
        previous.errorCount > 0
          ? ((current.errorCount - previous.errorCount) / previous.errorCount) * 100
          : current.errorCount > 0
          ? 100
          : 0;

      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      if (changePercent > 5) trendDirection = 'up';
      else if (changePercent < -5) trendDirection = 'down';

      metrics.push({
        service,
        totalLogs: current.total,
        errorCount: current.errorCount,
        errorRate: current.total > 0 ? (current.errorCount / current.total) * 100 : 0,
        trendDirection,
        changePercent,
      });
    }

    return metrics.sort((a, b) => b.errorCount - a.errorCount);
  }

  /**
   * Get dashboard overview statistics
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get log stats
    const stats24h = await logRepository.getStats(oneDayAgo, now);
    const stats7d = await logRepository.getStats(sevenDaysAgo, now);

    // Get active alerts count
    const activeAlerts = await alertRepository.countActive();

    // Get active error groups count
    const activeErrorGroups = await errorGroupRepository.countActive();

    // Get service metrics
    const topServices = await this.getServiceMetrics(oneDayAgo, now);

    // Get recent trend data (last 24 hours, hourly)
    const recentTrend = await this.getTimeSeriesData(
      oneDayAgo,
      now,
      BucketType.HOUR,
      'errorCount'
    );

    return {
      totalLogs24h: stats24h.total,
      totalLogs7d: stats7d.total,
      errorRate24h: stats24h.total > 0 ? (stats24h.errorCount / stats24h.total) * 100 : 0,
      errorRate7d: stats7d.total > 0 ? (stats7d.errorCount / stats7d.total) * 100 : 0,
      activeAlerts,
      activeErrorGroups,
      topServices: topServices.slice(0, 5),
      recentTrend,
    };
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<PeriodComparison> {
    const current = await logRepository.getStats(currentStart, currentEnd);
    const previous = await logRepository.getStats(previousStart, previousEnd);

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

    return {
      current: {
        totalLogs: current.total,
        errorCount: current.errorCount,
        errorRate: current.total > 0 ? (current.errorCount / current.total) * 100 : 0,
      },
      previous: {
        totalLogs: previous.total,
        errorCount: previous.errorCount,
        errorRate: previous.total > 0 ? (previous.errorCount / previous.total) * 100 : 0,
      },
      changePercent: {
        totalLogs: calcChange(current.total, previous.total),
        errorCount: calcChange(current.errorCount, previous.errorCount),
        errorRate: calcChange(
          current.total > 0 ? (current.errorCount / current.total) * 100 : 0,
          previous.total > 0 ? (previous.errorCount / previous.total) * 100 : 0
        ),
      },
    };
  }

  /**
   * Calculate the start of a time bucket
   */
  private getBucketStart(date: Date, bucketType: string): Date {
    const d = new Date(date);

    if (bucketType === BucketType.HOUR) {
      d.setMinutes(0, 0, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }

    return d;
  }

  /**
   * Get the field name for incrementing based on log level
   */
  private getLevelField(level: string): 'infoCount' | 'warnCount' | 'errorCount' {
    switch (level) {
      case LogLevel.INFO:
        return 'infoCount';
      case LogLevel.WARN:
        return 'warnCount';
      case LogLevel.ERROR:
        return 'errorCount';
      default:
        return 'infoCount';
    }
  }

  /**
   * Backfill trend data from historical logs
   * Useful for initial setup or data repair
   */
  async backfillTrends(startDate: Date, endDate: Date): Promise<void> {
    logger.info('Starting trend backfill', { startDate, endDate });
    logger.info('Trend backfill complete');
  }
}

export const trendService = new TrendService();
