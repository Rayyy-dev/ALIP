import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config';

// String constants for error group status (SQLite compatibility)
export const ErrorGroupStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  IGNORED: 'IGNORED',
} as const;

export type ErrorGroupStatusType = typeof ErrorGroupStatus[keyof typeof ErrorGroupStatus];

/**
 * Error group data access layer
 */
class ErrorGroupRepository {
  /**
   * Create a new error group
   */
  async create(data: {
    fingerprint: string;
    normalizedMessage: string;
    service: string;
    level: string;
    occurrenceCount: number;
    firstSeen: Date;
    lastSeen: Date;
    status: string;
  }) {
    return prisma.errorGroup.create({ data });
  }

  /**
   * Find error group by fingerprint
   */
  async findByFingerprint(fingerprint: string) {
    return prisma.errorGroup.findUnique({
      where: { fingerprint },
    });
  }

  /**
   * Find error group by ID
   */
  async findById(id: string, includeLogs: boolean = false) {
    return prisma.errorGroup.findUnique({
      where: { id },
      include: includeLogs
        ? {
            logs: {
              orderBy: { timestamp: 'desc' },
              take: 10,
            },
          }
        : undefined,
    });
  }

  /**
   * Update error group
   */
  async update(
    id: string,
    data: Prisma.ErrorGroupUpdateInput
  ) {
    return prisma.errorGroup.update({
      where: { id },
      data,
    });
  }

  /**
   * Find error groups with filtering and pagination
   */
  async findMany(
    where: Prisma.ErrorGroupWhereInput,
    orderBy: Prisma.ErrorGroupOrderByWithRelationInput,
    page: number = 1,
    limit: number = config.defaultPageSize
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.errorGroup.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.errorGroup.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find top error groups by occurrence count
   */
  async findTopByOccurrence(limit: number = 10, service?: string) {
    const where: Prisma.ErrorGroupWhereInput = {
      status: ErrorGroupStatus.ACTIVE,
    };

    if (service) {
      where.service = service;
    }

    return prisma.errorGroup.findMany({
      where,
      orderBy: { occurrenceCount: 'desc' },
      take: limit,
    });
  }

  /**
   * Find new error groups (first seen after date)
   */
  async findNewSince(since: Date, limit: number = 10, service?: string) {
    const where: Prisma.ErrorGroupWhereInput = {
      firstSeen: { gte: since },
    };

    if (service) {
      where.service = service;
    }

    return prisma.errorGroup.findMany({
      where,
      orderBy: { firstSeen: 'desc' },
      take: limit,
    });
  }

  /**
   * Count error groups by status
   */
  async countByStatus() {
    const result = await prisma.errorGroup.groupBy({
      by: ['status'],
      _count: true,
    });

    const counts: Record<string, number> = {
      ACTIVE: 0,
      RESOLVED: 0,
      IGNORED: 0,
    };

    for (const row of result) {
      counts[row.status] = row._count;
    }

    return counts;
  }

  /**
   * Count active error groups
   */
  async countActive(): Promise<number> {
    return prisma.errorGroup.count({
      where: { status: ErrorGroupStatus.ACTIVE },
    });
  }

  /**
   * Bulk update status for multiple groups
   */
  async bulkUpdateStatus(ids: string[], status: string) {
    return prisma.errorGroup.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  /**
   * Get services with active error groups
   */
  async getServicesWithActiveErrors() {
    const result = await prisma.errorGroup.findMany({
      where: { status: ErrorGroupStatus.ACTIVE },
      distinct: ['service'],
      select: { service: true },
    });

    return result.map((r) => r.service);
  }
}

export const errorGroupRepository = new ErrorGroupRepository();
