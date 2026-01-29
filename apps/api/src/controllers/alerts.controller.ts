import { Request, Response } from 'express';
import { alertService } from '../services/alert.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination';
import { AlertQueryParams } from '@alip/shared-types';

/**
 * Alerts controller
 */
export class AlertsController {
  /**
   * GET /api/alerts
   * List alerts with filtering and pagination
   */
  async list(req: Request, res: Response): Promise<void> {
    const pagination = parsePaginationParams(req.query);

    const params: AlertQueryParams = {
      page: pagination.page,
      limit: pagination.limit,
      status: req.query.status as AlertQueryParams['status'],
      ruleType: req.query.ruleType as AlertQueryParams['ruleType'],
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const { data, total } = await alertService.queryAlerts(params);
    res.json(createPaginatedResponse(data, total, pagination));
  }

  /**
   * GET /api/alerts/:id
   * Get alert by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const alert = await alertService.getAlertById(req.params.id);
    sendSuccess(res, alert);
  }

  /**
   * PATCH /api/alerts/:id
   * Update alert status
   */
  async update(req: Request, res: Response): Promise<void> {
    const alert = await alertService.updateAlert(req.params.id, req.body);
    sendSuccess(res, alert);
  }

  /**
   * GET /api/alerts/summary
   * Get alert summary for dashboard
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    const summary = await alertService.getAlertSummary();
    sendSuccess(res, summary);
  }
}

export const alertsController = new AlertsController();

/**
 * Alert rules controller
 */
export class AlertRulesController {
  /**
   * GET /api/alert-rules
   * List all alert rules
   */
  async list(req: Request, res: Response): Promise<void> {
    const rules = await alertService.listRules();
    sendSuccess(res, rules);
  }

  /**
   * GET /api/alert-rules/:id
   * Get alert rule by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const rule = await alertService.getRuleById(req.params.id);
    sendSuccess(res, rule);
  }

  /**
   * POST /api/alert-rules
   * Create a new alert rule
   */
  async create(req: Request, res: Response): Promise<void> {
    const rule = await alertService.createRule(req.body);
    sendCreated(res, rule);
  }

  /**
   * PATCH /api/alert-rules/:id
   * Update an alert rule
   */
  async update(req: Request, res: Response): Promise<void> {
    const rule = await alertService.updateRule(req.params.id, req.body);
    sendSuccess(res, rule);
  }

  /**
   * DELETE /api/alert-rules/:id
   * Delete an alert rule
   */
  async delete(req: Request, res: Response): Promise<void> {
    await alertService.deleteRule(req.params.id);
    sendNoContent(res);
  }
}

export const alertRulesController = new AlertRulesController();
