import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config';

// String constants for alert status (SQLite compatibility)
export const AlertStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
} as const;

export type AlertStatusType = typeof AlertStatus[keyof typeof AlertStatus];

/**
 * Alert data access layer
 */
class AlertRepository {
  /**
   * Create a new alert
   */
  async create(data: {
    alertRuleId: string;
    status: string;
    message: string;
    metadata: Record<string, unknown>;
    triggeredAt: Date;
  }) {
    return prisma.alert.create({
      data: {
        alertRuleId: data.alertRuleId,
        status: data.status,
        message: data.message,
        metadata: JSON.stringify(data.metadata),
        triggeredAt: data.triggeredAt,
      },
      include: {
        alertRule: true,
      },
    });
  }

  /**
   * Find alert by ID
   */
  async findById(id: string) {
    return prisma.alert.findUnique({
      where: { id },
      include: {
        alertRule: true,
      },
    });
  }

  /**
   * Find active alert by rule ID
   */
  async findActiveByRuleId(ruleId: string) {
    return prisma.alert.findFirst({
      where: {
        alertRuleId: ruleId,
        status: AlertStatus.ACTIVE,
      },
    });
  }

  /**
   * Update alert
   */
  async update(id: string, data: Prisma.AlertUpdateInput) {
    return prisma.alert.update({
      where: { id },
      data,
      include: {
        alertRule: true,
      },
    });
  }

  /**
   * Find alerts with filters and pagination
   */
  async findMany(
    where: Prisma.AlertWhereInput,
    page: number = 1,
    limit: number = config.defaultPageSize
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { triggeredAt: 'desc' },
        skip,
        take: limit,
        include: {
          alertRule: true,
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Count active alerts
   */
  async countActive(): Promise<number> {
    return prisma.alert.count({
      where: { status: AlertStatus.ACTIVE },
    });
  }

  /**
   * Count alerts by status
   */
  async countByStatus(status: string): Promise<number> {
    return prisma.alert.count({ where: { status } });
  }

  /**
   * Count alerts resolved since a date
   */
  async countResolvedSince(since: Date): Promise<number> {
    return prisma.alert.count({
      where: {
        status: AlertStatus.RESOLVED,
        resolvedAt: { gte: since },
      },
    });
  }

  /**
   * Find recent alerts
   */
  async findRecent(limit: number = 10) {
    return prisma.alert.findMany({
      orderBy: { triggeredAt: 'desc' },
      take: limit,
      include: {
        alertRule: true,
      },
    });
  }

  /**
   * Bulk resolve alerts for a rule
   */
  async bulkResolveByRuleId(ruleId: string) {
    return prisma.alert.updateMany({
      where: {
        alertRuleId: ruleId,
        status: AlertStatus.ACTIVE,
      },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }
}

export const alertRepository = new AlertRepository();
