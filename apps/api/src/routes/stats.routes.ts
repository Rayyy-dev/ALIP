import { Router } from 'express';
import { statsController } from '../controllers/stats.controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * Stats routes
 * Base path: /api/stats
 */

// Get overview statistics
router.get('/overview', asyncHandler(statsController.getOverview.bind(statsController)));

export default router;
