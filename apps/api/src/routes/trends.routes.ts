import { Router } from 'express';
import { trendsController } from '../controllers/trends.controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * Trend routes
 * Base path: /api/trends
 */

// Get time series data
router.get('/timeseries', asyncHandler(trendsController.getTimeSeries.bind(trendsController)));

// Get service metrics
router.get('/services', asyncHandler(trendsController.getServiceMetrics.bind(trendsController)));

// Compare periods
router.get('/compare', asyncHandler(trendsController.comparePeriods.bind(trendsController)));

// Get trends
router.get('/', asyncHandler(trendsController.getTrends.bind(trendsController)));

export default router;
