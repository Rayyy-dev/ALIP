/**
 * API client for communicating with the ALIP backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Generic API response type
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

/**
 * Paginated response type
 */
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.code
    );
  }

  return data.data;
}

/**
 * Fetch paginated data
 */
async function fetchPaginated<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PaginatedResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.code
    );
  }

  return data;
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Log ingestion
 */
export async function ingestLog(log: {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
  stackTrace?: string;
}) {
  return fetchApi<{ id: string; fingerprint: string; normalizedMessage: string }>(
    '/api/logs',
    {
      method: 'POST',
      body: JSON.stringify(log),
    }
  );
}

/**
 * Get logs with filtering
 */
export async function getLogs(params: {
  page?: number;
  limit?: number;
  level?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  errorGroupId?: string;
}) {
  return fetchPaginated<unknown>(`/api/logs${buildQueryString(params)}`);
}

/**
 * Get log statistics
 */
export async function getLogStats(params?: { startDate?: string; endDate?: string }) {
  return fetchApi<{
    total: number;
    infoCount: number;
    warnCount: number;
    errorCount: number;
    errorRate: number;
    services: string[];
  }>(`/api/logs/stats${buildQueryString(params || {})}`);
}

/**
 * Get available services
 */
export async function getServices() {
  return fetchApi<string[]>('/api/logs/services');
}

/**
 * Get error groups with filtering
 */
export async function getErrorGroups(params: {
  page?: number;
  limit?: number;
  status?: string;
  service?: string;
  level?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}) {
  return fetchPaginated<{
    id: string;
    fingerprint: string;
    normalizedMessage: string;
    service: string;
    level: string;
    occurrenceCount: number;
    firstSeen: string;
    lastSeen: string;
    status: string;
  }>(`/api/error-groups${buildQueryString(params)}`);
}

/**
 * Get error group by ID
 */
export async function getErrorGroup(id: string, includeLogs = true) {
  return fetchApi<{
    id: string;
    fingerprint: string;
    normalizedMessage: string;
    service: string;
    level: string;
    occurrenceCount: number;
    firstSeen: string;
    lastSeen: string;
    status: string;
    logs?: unknown[];
  }>(`/api/error-groups/${id}?includeLogs=${includeLogs}`);
}

/**
 * Update error group status
 */
export async function updateErrorGroup(id: string, status: string) {
  return fetchApi<unknown>(`/api/error-groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Get top recurring errors
 */
export async function getTopErrors(limit = 10, service?: string) {
  const params: Record<string, unknown> = { limit };
  if (service) params.service = service;
  return fetchApi<
    {
      id: string;
      normalizedMessage: string;
      service: string;
      level: string;
      occurrenceCount: number;
      lastSeen: string;
    }[]
  >(`/api/error-groups/top${buildQueryString(params)}`);
}

/**
 * Get error group counts by status
 */
export async function getErrorGroupCounts() {
  return fetchApi<{ ACTIVE: number; RESOLVED: number; IGNORED: number }>(
    '/api/error-groups/counts'
  );
}

/**
 * Get trend data
 */
export async function getTrends(params: {
  bucketType?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return fetchApi<
    {
      id: string;
      bucketStart: string;
      bucketType: string;
      service: string | null;
      totalLogs: number;
      infoCount: number;
      warnCount: number;
      errorCount: number;
      errorRate: number;
    }[]
  >(`/api/trends${buildQueryString(params)}`);
}

/**
 * Get time series data for charts
 */
export async function getTimeSeries(params: {
  startDate?: string;
  endDate?: string;
  bucketType?: string;
  metric?: string;
  service?: string;
}) {
  return fetchApi<{ timestamp: string; value: number }[]>(
    `/api/trends/timeseries${buildQueryString(params)}`
  );
}

/**
 * Get service metrics
 */
export async function getServiceMetrics(params?: { startDate?: string; endDate?: string }) {
  return fetchApi<
    {
      service: string;
      totalLogs: number;
      errorCount: number;
      errorRate: number;
      trendDirection: 'up' | 'down' | 'stable';
      changePercent: number;
    }[]
  >(`/api/trends/services${buildQueryString(params || {})}`);
}

/**
 * Get period comparison
 */
export async function getPeriodComparison() {
  return fetchApi<{
    current: { totalLogs: number; errorCount: number; errorRate: number };
    previous: { totalLogs: number; errorCount: number; errorRate: number };
    changePercent: { totalLogs: number; errorCount: number; errorRate: number };
  }>('/api/trends/compare');
}

/**
 * Get alerts
 */
export async function getAlerts(params: {
  page?: number;
  limit?: number;
  status?: string;
  ruleType?: string;
  startDate?: string;
  endDate?: string;
}) {
  return fetchPaginated<{
    id: string;
    alertRuleId: string;
    status: string;
    message: string;
    metadata: unknown;
    triggeredAt: string;
    resolvedAt: string | null;
    alertRule: {
      id: string;
      name: string;
      ruleType: string;
    };
  }>(`/api/alerts${buildQueryString(params)}`);
}

/**
 * Update alert status
 */
export async function updateAlert(id: string, status: string) {
  return fetchApi<unknown>(`/api/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Get alert summary
 */
export async function getAlertSummary() {
  return fetchApi<{
    activeCount: number;
    acknowledgedCount: number;
    resolvedTodayCount: number;
    recentAlerts: unknown[];
  }>('/api/alerts/summary');
}

/**
 * Get alert rules
 */
export async function getAlertRules() {
  return fetchApi<
    {
      id: string;
      name: string;
      description: string | null;
      ruleType: string;
      threshold: number;
      windowMinutes: number;
      service: string | null;
      enabled: boolean;
    }[]
  >('/api/alert-rules');
}

/**
 * Create alert rule
 */
export async function createAlertRule(rule: {
  name: string;
  description?: string;
  ruleType: string;
  threshold: number;
  windowMinutes?: number;
  service?: string;
  enabled?: boolean;
}) {
  return fetchApi<unknown>('/api/alert-rules', {
    method: 'POST',
    body: JSON.stringify(rule),
  });
}

/**
 * Update alert rule
 */
export async function updateAlertRule(
  id: string,
  updates: {
    name?: string;
    description?: string;
    threshold?: number;
    windowMinutes?: number;
    service?: string;
    enabled?: boolean;
  }
) {
  return fetchApi<unknown>(`/api/alert-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete alert rule
 */
export async function deleteAlertRule(id: string) {
  return fetchApi<void>(`/api/alert-rules/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get overview statistics
 */
export async function getOverviewStats() {
  return fetchApi<{
    totalLogs24h: number;
    totalLogs7d: number;
    errorRate24h: number;
    errorRate7d: number;
    activeAlerts: number;
    activeErrorGroups: number;
    topServices: {
      service: string;
      totalLogs: number;
      errorCount: number;
      errorRate: number;
      trendDirection: 'up' | 'down' | 'stable';
      changePercent: number;
    }[];
    recentTrend: { timestamp: string; value: number }[];
  }>('/api/stats/overview');
}

/**
 * Get health status
 */
export async function getHealth() {
  return fetchApi<{
    status: string;
    version: string;
    uptime: number;
    database: { connected: boolean; latencyMs: number };
  }>('/api/health');
}
