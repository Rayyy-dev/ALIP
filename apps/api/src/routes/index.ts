import { Router } from 'express';
import logsRouter from './logs.routes';
import errorGroupsRouter from './error-groups.routes';
import trendsRouter from './trends.routes';
import alertsRouter, { alertRulesRouter } from './alerts.routes';
import statsRouter from './stats.routes';
import { statsController } from '../controllers/stats.controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * API routes aggregator
 * All routes are prefixed with /api
 */

// Mount route modules
router.use('/logs', logsRouter);
router.use('/error-groups', errorGroupsRouter);
router.use('/trends', trendsRouter);
router.use('/alerts', alertsRouter);
router.use('/alert-rules', alertRulesRouter);
router.use('/stats', statsRouter);

// Health check at /api/health
router.get('/health', asyncHandler(statsController.healthCheck.bind(statsController)));

export default router;
