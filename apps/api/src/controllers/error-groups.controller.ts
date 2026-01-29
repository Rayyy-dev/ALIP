import { Request, Response } from 'express';
import { errorGroupService } from '../services/error-grouping.service';
import { sendSuccess } from '../utils/response';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination';
import { ErrorGroupQueryParams } from '@alip/shared-types';

/**
 * Error groups controller
 */
export class ErrorGroupsController {
  /**
   * GET /api/error-groups
   * List error groups with filtering and pagination
   */
  async list(req: Request, res: Response): Promise<void> {
    const pagination = parsePaginationParams(req.query);

    const params: ErrorGroupQueryParams = {
      page: pagination.page,
      limit: pagination.limit,
      status: req.query.status as ErrorGroupQueryParams['status'],
      service: req.query.service as string,
      level: req.query.level as ErrorGroupQueryParams['level'],
      sortBy: req.query.sortBy as ErrorGroupQueryParams['sortBy'],
      sortOrder: req.query.sortOrder as ErrorGroupQueryParams['sortOrder'],
      search: req.query.search as string,
    };

    const { data, total } = await errorGroupService.queryGroups(params);
    res.json(createPaginatedResponse(data, total, pagination));
  }

  /**
   * GET /api/error-groups/:id
   * Get error group by ID with sample logs
   */
  async getById(req: Request, res: Response): Promise<void> {
    const includeLogs = req.query.includeLogs !== 'false';
    const group = await errorGroupService.getGroupById(req.params.id, includeLogs);
    sendSuccess(res, group);
  }

  /**
   * PATCH /api/error-groups/:id
   * Update error group status
   */
  async update(req: Request, res: Response): Promise<void> {
    const group = await errorGroupService.updateGroupStatus(req.params.id, req.body);
    sendSuccess(res, group);
  }

  /**
   * GET /api/error-groups/top
   * Get top recurring errors
   */
  async getTop(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10;
    const service = req.query.service as string | undefined;
    const groups = await errorGroupService.getTopRecurringErrors(limit, service);
    sendSuccess(res, groups);
  }

  /**
   * GET /api/error-groups/new
   * Get newly appeared error groups
   */
  async getNew(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10;
    const since = req.query.since
      ? new Date(req.query.since as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24h
    const groups = await errorGroupService.getNewErrorGroups(since, limit);
    sendSuccess(res, groups);
  }

  /**
   * GET /api/error-groups/counts
   * Get error group counts by status
   */
  async getCounts(req: Request, res: Response): Promise<void> {
    const counts = await errorGroupService.getGroupCountsByStatus();
    sendSuccess(res, counts);
  }

  /**
   * POST /api/error-groups/bulk-update
   * Bulk update status for multiple groups
   */
  async bulkUpdate(req: Request, res: Response): Promise<void> {
    const { ids, status } = req.body;
    await errorGroupService.bulkUpdateStatus(ids, status);
    sendSuccess(res, { updated: ids.length });
  }
}

export const errorGroupsController = new ErrorGroupsController();
