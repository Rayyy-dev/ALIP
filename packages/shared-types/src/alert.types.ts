/**
 * Alert rule type enumeration
 */
export enum AlertRuleType {
  ERROR_COUNT_THRESHOLD = 'ERROR_COUNT_THRESHOLD',
  SPIKE_DETECTION = 'SPIKE_DETECTION',
  NEW_ERROR_TYPE = 'NEW_ERROR_TYPE',
}

/**
 * Alert status enumeration
 */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: AlertRuleType;
  threshold: number;
  windowMinutes: number;
  service: string | null; // null means all services
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alert rule creation input
 */
export interface AlertRuleInput {
  name: string;
  description?: string;
  ruleType: AlertRuleType;
  threshold: number;
  windowMinutes?: number;
  service?: string;
  enabled?: boolean;
}

/**
 * Alert rule update input
 */
export interface AlertRuleUpdateInput {
  name?: string;
  description?: string;
  threshold?: number;
  windowMinutes?: number;
  service?: string;
  enabled?: boolean;
}

/**
 * Alert entity representing a triggered alert
 */
export interface Alert {
  id: string;
  alertRuleId: string;
  status: AlertStatus;
  message: string;
  metadata: AlertMetadata | null;
  triggeredAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alert with its associated rule
 */
export interface AlertWithRule extends Alert {
  alertRule: AlertRule;
}

/**
 * Alert metadata containing contextual information
 */
export interface AlertMetadata {
  currentValue?: number;
  threshold?: number;
  windowMinutes?: number;
  service?: string;
  errorGroupId?: string;
  historicalAvg?: number;
  percentageIncrease?: number;
}

/**
 * Alert query parameters
 */
export interface AlertQueryParams {
  page?: number;
  limit?: number;
  status?: AlertStatus;
  ruleType?: AlertRuleType;
  service?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Alert update input
 */
export interface AlertUpdateInput {
  status?: AlertStatus;
}

/**
 * Alert summary for dashboard
 */
export interface AlertSummary {
  activeCount: number;
  acknowledgedCount: number;
  resolvedTodayCount: number;
  recentAlerts: Alert[];
}
