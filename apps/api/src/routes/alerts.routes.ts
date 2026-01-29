import { Router } from 'express';
import { alertsController, alertRulesController } from '../controllers/alerts.controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * Alert routes
 * Base path: /api/alerts
 */

// Get alert summary
router.get('/summary', asyncHandler(alertsController.getSummary.bind(alertsController)));

// List alerts
router.get('/', asyncHandler(alertsController.list.bind(alertsController)));

// Get specific alert
router.get('/:id', asyncHandler(alertsController.getById.bind(alertsController)));

// Update alert
router.patch('/:id', asyncHandler(alertsController.update.bind(alertsController)));

export default router;

/**
 * Alert rule routes
 * Base path: /api/alert-rules
 */
export const alertRulesRouter = Router();

// List alert rules
alertRulesRouter.get('/', asyncHandler(alertRulesController.list.bind(alertRulesController)));

// Create alert rule
alertRulesRouter.post('/', asyncHandler(alertRulesController.create.bind(alertRulesController)));

// Get specific alert rule
alertRulesRouter.get('/:id', asyncHandler(alertRulesController.getById.bind(alertRulesController)));

// Update alert rule
alertRulesRouter.patch('/:id', asyncHandler(alertRulesController.update.bind(alertRulesController)));

// Delete alert rule
alertRulesRouter.delete('/:id', asyncHandler(alertRulesController.delete.bind(alertRulesController)));
