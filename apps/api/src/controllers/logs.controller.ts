import { Request, Response } from 'express';
import { logService } from '../services/log.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination';
import { LogQueryParams } from '@alip/shared-types';

/**
 * Log controller
 * Handles HTTP requests for log operations
 */
export class LogsController {
  /**
   * POST /api/logs
   * Ingest a single log or batch of logs
   */
  async ingest(req: Request, res: Response): Promise<void> {
    const body = req.body;

    // Check if batch or single log
    if (Array.isArray(body.logs)) {
      const result = await logService.ingestBatch(body);
      sendCreated(res, result);
    } else {
      const log = await logService.ingestLog(body);
      sendCreated(res, {
        id: log.id,
        fingerprint: log.fingerprint,
        normalizedMessage: log.normalizedMessage,
      });
    }
  }

  /**
   * GET /api/logs
   * List logs with filtering and pagination
   */
  async list(req: Request, res: Response): Promise<void> {
    const pagination = parsePaginationParams(req.query);

    const params: LogQueryParams = {
      page: pagination.page,
      limit: pagination.limit,
      level: req.query.level as LogQueryParams['level'],
      service: req.query.service as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
      errorGroupId: req.query.errorGroupId as string,
    };

    const { data, total } = await logService.queryLogs(params);
    res.json(createPaginatedResponse(data, total, pagination));
  }

  /**
   * GET /api/logs/:id
   * Get a specific log by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const log = await logService.getLogById(req.params.id);
    sendSuccess(res, log);
  }

  /**
   * GET /api/logs/stats
   * Get log statistics for a time period
   */
  async getStats(req: Request, res: Response): Promise<void> {
    const stats = await logService.getStats(
      req.query.startDate as string,
      req.query.endDate as string
    );
    sendSuccess(res, stats);
  }

  /**
   * GET /api/logs/services
   * Get list of all service names
   */
  async getServices(req: Request, res: Response): Promise<void> {
    const services = await logService.getServices();
    sendSuccess(res, services);
  }
}

export const logsController = new LogsController();
