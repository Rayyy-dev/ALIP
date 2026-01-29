import { Router } from 'express';
import { errorGroupsController } from '../controllers/error-groups.controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * Error group routes
 * Base path: /api/error-groups
 */

// Get top recurring errors
router.get('/top', asyncHandler(errorGroupsController.getTop.bind(errorGroupsController)));

// Get new error groups
router.get('/new', asyncHandler(errorGroupsController.getNew.bind(errorGroupsController)));

// Get counts by status
router.get('/counts', asyncHandler(errorGroupsController.getCounts.bind(errorGroupsController)));

// Bulk update status
router.post('/bulk-update', asyncHandler(errorGroupsController.bulkUpdate.bind(errorGroupsController)));

// List error groups
router.get('/', asyncHandler(errorGroupsController.list.bind(errorGroupsController)));

// Get specific error group
router.get('/:id', asyncHandler(errorGroupsController.getById.bind(errorGroupsController)));

// Update error group
router.patch('/:id', asyncHandler(errorGroupsController.update.bind(errorGroupsController)));

export default router;
