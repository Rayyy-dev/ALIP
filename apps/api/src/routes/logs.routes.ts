import { Router } from 'express';
import { logsController } from '../controllers/logs.controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * Log routes
 * Base path: /api/logs
 */

// Ingest logs (single or batch)
router.post('/', asyncHandler(logsController.ingest.bind(logsController)));

// Get log statistics
router.get('/stats', asyncHandler(logsController.getStats.bind(logsController)));

// Get list of services
router.get('/services', asyncHandler(logsController.getServices.bind(logsController)));

// List logs with filtering
router.get('/', asyncHandler(logsController.list.bind(logsController)));

// Get specific log
router.get('/:id', asyncHandler(logsController.getById.bind(logsController)));

export default router;
