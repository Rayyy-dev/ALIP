import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

// String constants for alert rule types (SQLite compatibility)
export const AlertRuleType = {
  ERROR_COUNT_THRESHOLD: 'ERROR_COUNT_THRESHOLD',
  SPIKE_DETECTION: 'SPIKE_DETECTION',
  NEW_ERROR_TYPE: 'NEW_ERROR_TYPE',
} as const;

export type AlertRuleTypeValue = typeof AlertRuleType[keyof typeof AlertRuleType];

/**
 * Alert rule data access layer
 */
class AlertRuleRepository {
  /**
   * Create a new alert rule
   */
  async create(data: {
    name: string;
    description?: string;
    ruleType: string;
    threshold: number;
    windowMinutes: number;
    service?: string;
    enabled: boolean;
  }) {
    return prisma.alertRule.create({
      data: {
        name: data.name,
        description: data.description,
        ruleType: data.ruleType,
        threshold: data.threshold,
        windowMinutes: data.windowMinutes,
        service: data.service,
        enabled: data.enabled,
      },
    });
  }

  /**
   * Find alert rule by ID
   */
  async findById(id: string) {
    return prisma.alertRule.findUnique({
      where: { id },
      include: {
        _count: {
          select: { alerts: true },
        },
      },
    });
  }

  /**
   * Find all alert rules
   */
  async findAll() {
    return prisma.alertRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { alerts: true },
        },
      },
    });
  }

  /**
   * Find enabled alert rules
   */
  async findEnabled() {
    return prisma.alertRule.findMany({
      where: { enabled: true },
    });
  }

  /**
   * Update alert rule
   */
  async update(id: string, data: Prisma.AlertRuleUpdateInput) {
    return prisma.alertRule.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete alert rule (cascades to alerts)
   */
  async delete(id: string) {
    return prisma.alertRule.delete({
      where: { id },
    });
  }

  /**
   * Find rules for a specific service
   */
  async findByService(service: string) {
    return prisma.alertRule.findMany({
      where: {
        OR: [
          { service },
          { service: null },
        ],
        enabled: true,
      },
    });
  }
}

export const alertRuleRepository = new AlertRuleRepository();
