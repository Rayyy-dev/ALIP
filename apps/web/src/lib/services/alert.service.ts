import type {
  AlertRuleInput,
  AlertRuleUpdateInput,
  AlertQueryParams,
  AlertUpdateInput,
  AlertSummary,
  AlertMetadata,
} from '@alip/shared-types';
import { alertRepository, AlertStatus } from '@/lib/repositories/alert.repository';
import { alertRuleRepository, AlertRuleType } from '@/lib/repositories/alert-rule.repository';
import { logRepository } from '@/lib/repositories/log.repository';
import { errorGroupRepository } from '@/lib/repositories/error-group.repository';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * Schema for alert rule creation
 */
const alertRuleInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ruleType: z.enum(['ERROR_COUNT_THRESHOLD', 'SPIKE_DETECTION', 'NEW_ERROR_TYPE']),
  threshold: z.number().int().positive(),
  windowMinutes: z.number().int().positive().default(60),
  service: z.string().max(100).optional(),
  enabled: z.boolean().default(true),
});

/**
 * Alert management service
 * Handles alert rules, evaluation, and lifecycle
 */
class AlertService {
  /**
   * Create a new alert rule
   */
  async createRule(input: AlertRuleInput) {
    const validated = alertRuleInputSchema.parse(input);

    return alertRuleRepository.create({
      name: validated.name,
      description: validated.description,
      ruleType: validated.ruleType,
      threshold: validated.threshold,
      windowMinutes: validated.windowMinutes,
      service: validated.service,
      enabled: validated.enabled,
    });
  }

  /**
   * Get alert rule by ID
   */
  async getRuleById(id: string) {
    const rule = await alertRuleRepository.findById(id);

    if (!rule) {
      throw new NotFoundError('AlertRule', id);
    }

    return rule;
  }

  /**
   * List all alert rules
   */
  async listRules() {
    return alertRuleRepository.findAll();
  }

  /**
   * Update an alert rule
   */
  async updateRule(id: string, input: AlertRuleUpdateInput) {
    const rule = await alertRuleRepository.findById(id);

    if (!rule) {
      throw new NotFoundError('AlertRule', id);
    }

    return alertRuleRepository.update(id, input);
  }

  /**
   * Delete an alert rule
   */
  async deleteRule(id: string) {
    const rule = await alertRuleRepository.findById(id);

    if (!rule) {
      throw new NotFoundError('AlertRule', id);
    }

    await alertRuleRepository.delete(id);
  }

  /**
   * Evaluate all enabled alert rules for a service
   * Called after log ingestion
   */
  async evaluateAlerts(service: string): Promise<void> {
    const rules = await alertRuleRepository.findEnabled();

    for (const rule of rules) {
      // Skip rules for other services
      if (rule.service && rule.service !== service) {
        continue;
      }

      try {
        await this.evaluateRule(rule);
      } catch (err) {
        logger.error('Failed to evaluate alert rule', {
          ruleId: rule.id,
          error: (err as Error).message,
        });
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: {
    id: string;
    ruleType: string;
    threshold: number;
    windowMinutes: number;
    service: string | null;
  }): Promise<void> {
    switch (rule.ruleType) {
      case AlertRuleType.ERROR_COUNT_THRESHOLD:
        await this.evaluateErrorCountThreshold(rule);
        break;
      case AlertRuleType.SPIKE_DETECTION:
        await this.evaluateSpikeDetection(rule);
        break;
      case AlertRuleType.NEW_ERROR_TYPE:
        await this.evaluateNewErrorType(rule);
        break;
    }
  }

  /**
   * Evaluate error count threshold rule
   * Triggers if error count in window exceeds threshold
   */
  private async evaluateErrorCountThreshold(rule: {
    id: string;
    threshold: number;
    windowMinutes: number;
    service: string | null;
  }): Promise<void> {
    const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
    const stats = await logRepository.getStats(
      windowStart,
      new Date(),
      rule.service || undefined
    );

    if (stats.errorCount >= rule.threshold) {
      // Check if there's already an active alert for this rule
      const existingAlert = await alertRepository.findActiveByRuleId(rule.id);

      if (!existingAlert) {
        await this.createAlert(
          rule.id,
          `Error count threshold exceeded: ${stats.errorCount} errors in last ${rule.windowMinutes} minutes`,
          {
            currentValue: stats.errorCount,
            threshold: rule.threshold,
            windowMinutes: rule.windowMinutes,
            service: rule.service || undefined,
          }
        );
      }
    } else {
      // Auto-resolve if below threshold
      await this.autoResolveAlerts(rule.id);
    }
  }

  /**
   * Evaluate spike detection rule
   * Triggers if current error rate is significantly higher than historical average
   */
  private async evaluateSpikeDetection(rule: {
    id: string;
    threshold: number;
    windowMinutes: number;
    service: string | null;
  }): Promise<void> {
    const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
    const currentStats = await logRepository.getStats(
      windowStart,
      new Date(),
      rule.service || undefined
    );

    // Get historical average (previous 7 days, same time window)
    const historicalWindows: number[] = [];
    for (let i = 1; i <= 7; i++) {
      const histStart = new Date(windowStart.getTime() - i * 24 * 60 * 60 * 1000);
      const histEnd = new Date(histStart.getTime() + rule.windowMinutes * 60 * 1000);
      const histStats = await logRepository.getStats(histStart, histEnd, rule.service || undefined);
      historicalWindows.push(histStats.errorCount);
    }

    const historicalAvg =
      historicalWindows.length > 0
        ? historicalWindows.reduce((a, b) => a + b, 0) / historicalWindows.length
        : 0;

    // Detect spike using z-score approach
    const isSpike = this.detectSpike(
      currentStats.errorCount,
      historicalAvg,
      this.calculateStdDev(historicalWindows, historicalAvg),
      rule.threshold / 100 // threshold as standard deviations (e.g., 200 = 2 std devs)
    );

    if (isSpike) {
      const existingAlert = await alertRepository.findActiveByRuleId(rule.id);

      if (!existingAlert) {
        const percentageIncrease =
          historicalAvg > 0
            ? ((currentStats.errorCount - historicalAvg) / historicalAvg) * 100
            : currentStats.errorCount > 0
            ? 100
            : 0;

        await this.createAlert(
          rule.id,
          `Error spike detected: ${currentStats.errorCount} errors (${percentageIncrease.toFixed(0)}% above average)`,
          {
            currentValue: currentStats.errorCount,
            threshold: rule.threshold,
            windowMinutes: rule.windowMinutes,
            service: rule.service || undefined,
            historicalAvg,
            percentageIncrease,
          }
        );
      }
    } else {
      await this.autoResolveAlerts(rule.id);
    }
  }

  /**
   * Evaluate new error type rule
   * Triggers when a new unique error pattern is detected
   */
  private async evaluateNewErrorType(rule: {
    id: string;
    threshold: number;
    windowMinutes: number;
    service: string | null;
  }): Promise<void> {
    const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);

    const newGroups = await errorGroupRepository.findNewSince(
      windowStart,
      rule.threshold + 1,
      rule.service || undefined
    );

    if (newGroups.length >= rule.threshold) {
      const existingAlert = await alertRepository.findActiveByRuleId(rule.id);

      if (!existingAlert) {
        await this.createAlert(
          rule.id,
          `${newGroups.length} new error types detected in last ${rule.windowMinutes} minutes`,
          {
            currentValue: newGroups.length,
            threshold: rule.threshold,
            windowMinutes: rule.windowMinutes,
            service: rule.service || undefined,
          }
        );
      }
    }
  }

  /**
   * Detect if current value represents a spike
   */
  private detectSpike(
    currentCount: number,
    historicalAvg: number,
    historicalStdDev: number,
    thresholdStdDevs: number = 2
  ): boolean {
    // If no historical data, use absolute threshold
    if (historicalAvg === 0) {
      return currentCount > 10;
    }

    const zScore = (currentCount - historicalAvg) / (historicalStdDev || 1);
    return zScore > thresholdStdDevs;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;

    const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Create a new alert
   */
  private async createAlert(
    ruleId: string,
    message: string,
    metadata: AlertMetadata
  ): Promise<void> {
    await alertRepository.create({
      alertRuleId: ruleId,
      status: AlertStatus.ACTIVE,
      message,
      metadata: metadata as unknown as Record<string, unknown>,
      triggeredAt: new Date(),
    });

    logger.warn('Alert triggered', { ruleId, message });
  }

  /**
   * Auto-resolve active alerts for a rule
   */
  private async autoResolveAlerts(ruleId: string): Promise<void> {
    const activeAlerts = await alertRepository.findActiveByRuleId(ruleId);

    if (activeAlerts) {
      await alertRepository.update(activeAlerts.id, {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
      });

      logger.info('Alert auto-resolved', { alertId: activeAlerts.id, ruleId });
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(id: string) {
    const alert = await alertRepository.findById(id);

    if (!alert) {
      throw new NotFoundError('Alert', id);
    }

    return alert;
  }

  /**
   * Query alerts with filters
   */
  async queryAlerts(params: AlertQueryParams) {
    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.ruleType) {
      where.alertRule = { ruleType: params.ruleType };
    }

    if (params.startDate || params.endDate) {
      where.triggeredAt = {};
      if (params.startDate) {
        (where.triggeredAt as Record<string, Date>).gte = new Date(params.startDate);
      }
      if (params.endDate) {
        (where.triggeredAt as Record<string, Date>).lte = new Date(params.endDate);
      }
    }

    return alertRepository.findMany(where, params.page, params.limit);
  }

  /**
   * Update alert status
   */
  async updateAlert(id: string, input: AlertUpdateInput) {
    const alert = await alertRepository.findById(id);

    if (!alert) {
      throw new NotFoundError('Alert', id);
    }

    const updates: Record<string, unknown> = { status: input.status };

    if (input.status === AlertStatus.RESOLVED) {
      updates.resolvedAt = new Date();
    }

    return alertRepository.update(id, updates);
  }

  /**
   * Get alert summary for dashboard
   */
  async getAlertSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeCount, acknowledgedCount, resolvedTodayCount, recentAlerts] =
      await Promise.all([
        alertRepository.countByStatus(AlertStatus.ACTIVE),
        alertRepository.countByStatus(AlertStatus.ACKNOWLEDGED),
        alertRepository.countResolvedSince(today),
        alertRepository.findRecent(5),
      ]);

    return {
      activeCount,
      acknowledgedCount,
      resolvedTodayCount,
      recentAlerts,
    };
  }
}

export const alertService = new AlertService();
