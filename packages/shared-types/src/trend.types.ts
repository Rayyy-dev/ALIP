/**
 * Time bucket type for aggregation
 */
export enum BucketType {
  HOUR = 'HOUR',
  DAY = 'DAY',
}

/**
 * Error trend data point for a time bucket
 */
export interface ErrorTrend {
  id: string;
  bucketStart: Date;
  bucketType: BucketType;
  service: string | null; // null means all services aggregated
  totalLogs: number;
  infoCount: number;
  warnCount: number;
  errorCount: number;
  errorRate: number;
  createdAt: Date;
}

/**
 * Trend query parameters
 */
export interface TrendQueryParams {
  bucketType?: BucketType;
  service?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Time series data point for charts
 */
export interface TimeSeriesPoint {
  timestamp: string; // ISO format for easy parsing
  value: number;
  label?: string;
}

/**
 * Chart data for frontend rendering
 */
export interface TrendChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

/**
 * Service-level metrics for comparison
 */
export interface ServiceMetrics {
  service: string;
  totalLogs: number;
  errorCount: number;
  errorRate: number;
  trendDirection: 'up' | 'down' | 'stable';
  changePercent: number;
}

/**
 * Dashboard overview statistics
 */
export interface OverviewStats {
  totalLogs24h: number;
  totalLogs7d: number;
  errorRate24h: number;
  errorRate7d: number;
  activeAlerts: number;
  activeErrorGroups: number;
  topServices: ServiceMetrics[];
  recentTrend: TimeSeriesPoint[];
}

/**
 * Comparison data between two time periods
 */
export interface PeriodComparison {
  current: {
    totalLogs: number;
    errorCount: number;
    errorRate: number;
  };
  previous: {
    totalLogs: number;
    errorCount: number;
    errorRate: number;
  };
  changePercent: {
    totalLogs: number;
    errorCount: number;
    errorRate: number;
  };
}
