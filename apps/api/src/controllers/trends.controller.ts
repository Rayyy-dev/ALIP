import { Request, Response } from 'express';
import { BucketType } from '@prisma/client';
import { trendService } from '../services/trend.service';
import { sendSuccess } from '../utils/response';
import { TrendQueryParams } from '@alip/shared-types';

/**
 * Trends controller
 */
export class TrendsController {
  /**
   * GET /api/trends
   * Get trend data for charts
   */
  async getTrends(req: Request, res: Response): Promise<void> {
    const params: TrendQueryParams = {
      bucketType: req.query.bucketType as TrendQueryParams['bucketType'],
      service: req.query.service as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const trends = await trendService.getTrends(params);
    sendSuccess(res, trends);
  }

  /**
   * GET /api/trends/timeseries
   * Get time series data for specific metric
   */
  async getTimeSeries(req: Request, res: Response): Promise<void> {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const bucketType = (req.query.bucketType as BucketType) || BucketType.HOUR;
    const metric = (req.query.metric as 'totalLogs' | 'errorCount' | 'errorRate') || 'errorCount';
    const service = req.query.service as string | undefined;

    const data = await trendService.getTimeSeriesData(
      startDate,
      endDate,
      bucketType,
      metric,
      service
    );
    sendSuccess(res, data);
  }

  /**
   * GET /api/trends/services
   * Get metrics by service
   */
  async getServiceMetrics(req: Request, res: Response): Promise<void> {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const metrics = await trendService.getServiceMetrics(startDate, endDate);
    sendSuccess(res, metrics);
  }

  /**
   * GET /api/trends/compare
   * Compare two time periods
   */
  async comparePeriods(req: Request, res: Response): Promise<void> {
    const currentEnd = new Date();
    const currentStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    const previousStart = new Date(previousEnd.getTime() - 24 * 60 * 60 * 1000);

    const comparison = await trendService.comparePeriods(
      currentStart,
      currentEnd,
      previousStart,
      previousEnd
    );
    sendSuccess(res, comparison);
  }
}

export const trendsController = new TrendsController();
