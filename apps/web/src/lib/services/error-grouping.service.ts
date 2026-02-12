import type { ErrorGroupQueryParams, ErrorGroupUpdateInput } from '@alip/shared-types';
import { errorGroupRepository, ErrorGroupStatus } from '@/lib/repositories/error-group.repository';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Error grouping service
 * Manages the grouping of similar errors and their lifecycle
 */
class ErrorGroupingService {
  /**
   * Update existing error group or create a new one
   * Uses upsert pattern for atomic operation
   */
  async updateOrCreateGroup(
    fingerprint: string,
    normalizedMessage: string,
    service: string,
    level: string,
    timestamp: Date
  ) {
    const existing = await errorGroupRepository.findByFingerprint(fingerprint);

    if (existing) {
      // Update existing group
      const updated = await errorGroupRepository.update(existing.id, {
        occurrenceCount: { increment: 1 },
        lastSeen: timestamp > existing.lastSeen ? timestamp : existing.lastSeen,
        // Reactivate if it was resolved/ignored and we see it again
        status: existing.status !== ErrorGroupStatus.ACTIVE
          ? ErrorGroupStatus.ACTIVE
          : existing.status,
      });

      logger.debug('Error group updated', {
        groupId: existing.id,
        occurrenceCount: updated.occurrenceCount,
      });

      return updated;
    }

    // Create new group
    const created = await errorGroupRepository.create({
      fingerprint,
      normalizedMessage,
      service,
      level,
      occurrenceCount: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
      status: ErrorGroupStatus.ACTIVE,
    });

    logger.info('New error group created', {
      groupId: created.id,
      service,
      level,
    });

    return created;
  }

  /**
   * Get error group by ID with sample logs
   */
  async getGroupById(id: string, includeLogs: boolean = true) {
    const group = await errorGroupRepository.findById(id, includeLogs);

    if (!group) {
      throw new NotFoundError('ErrorGroup', id);
    }

    return group;
  }

  /**
   * Query error groups with filtering and pagination
   */
  async queryGroups(params: ErrorGroupQueryParams) {
    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.service) {
      where.service = params.service;
    }

    if (params.level) {
      where.level = params.level;
    }

    if (params.search) {
      where.normalizedMessage = { contains: params.search, mode: 'insensitive' };
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'desc';
    } else {
      orderBy.lastSeen = 'desc';
    }

    return errorGroupRepository.findMany(where, orderBy, params.page, params.limit);
  }

  /**
   * Update error group status
   */
  async updateGroupStatus(id: string, input: ErrorGroupUpdateInput) {
    const group = await errorGroupRepository.findById(id, false);

    if (!group) {
      throw new NotFoundError('ErrorGroup', id);
    }

    return errorGroupRepository.update(id, {
      status: input.status,
    });
  }

  /**
   * Get top recurring errors by occurrence count
   */
  async getTopRecurringErrors(limit: number = 10, service?: string) {
    return errorGroupRepository.findTopByOccurrence(limit, service);
  }

  /**
   * Get new error groups (first seen within time range)
   */
  async getNewErrorGroups(since: Date, limit: number = 10) {
    return errorGroupRepository.findNewSince(since, limit);
  }

  /**
   * Get error group count by status
   */
  async getGroupCountsByStatus() {
    return errorGroupRepository.countByStatus();
  }

  /**
   * Bulk update status for multiple groups
   */
  async bulkUpdateStatus(ids: string[], status: string) {
    return errorGroupRepository.bulkUpdateStatus(ids, status);
  }
}

export const errorGroupService = new ErrorGroupingService();
