import { Request, Response } from 'express';
import { trendService } from '../services/trend.service';
import { testConnection } from '../config/database';
import { sendSuccess } from '../utils/response';

/**
 * Stats and health controller
 */
export class StatsController {
  /**
   * GET /api/stats/overview
   * Get dashboard overview statistics
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    const stats = await trendService.getOverviewStats();
    sendSuccess(res, stats);
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const startTime = process.hrtime();
    const dbConnected = await testConnection();
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const latencyMs = seconds * 1000 + nanoseconds / 1000000;

    const status = dbConnected ? 'healthy' : 'unhealthy';

    sendSuccess(res, {
      status,
      version: '1.0.0',
      uptime: process.uptime(),
      database: {
        connected: dbConnected,
        latencyMs: Math.round(latencyMs * 100) / 100,
      },
    });
  }
}

export const statsController = new StatsController();
