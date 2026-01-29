'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { LogVolumeChart } from '@/components/charts/log-volume-chart';
import { ErrorRateChart } from '@/components/charts/error-rate-chart';
import { ServiceMetricsChart } from '@/components/charts/service-metrics-chart';
import { PageLoading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { getTrends, getPeriodComparison, getServiceMetrics, getServices } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

interface TrendData {
  bucketStart: string;
  bucketType: string;
  service: string | null;
  totalLogs: number;
  infoCount: number;
  warnCount: number;
  errorCount: number;
  errorRate: number;
}

interface ServiceMetric {
  service: string;
  totalLogs: number;
  errorCount: number;
  errorRate: number;
  trendDirection: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface PeriodComparison {
  current: { totalLogs: number; errorCount: number; errorRate: number };
  previous: { totalLogs: number; errorCount: number; errorRate: number };
  changePercent: { totalLogs: number; errorCount: number; errorRate: number };
}

/**
 * Trends page
 * Displays log volume, error rate, and service metrics over time
 */
export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetric[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [bucketType, setBucketType] = useState<'HOUR' | 'DAY'>('HOUR');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date(
        bucketType === 'HOUR'
          ? endDate.getTime() - 24 * 60 * 60 * 1000
          : endDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );

      const [trendsData, comparisonData, metricsData, servicesData] =
        await Promise.all([
          getTrends({
            bucketType,
            service: selectedService || undefined,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
          getPeriodComparison(),
          getServiceMetrics(),
          getServices(),
        ]);

      setTrends(trendsData);
      setComparison(comparisonData);
      setServiceMetrics(metricsData);
      setServices(servicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [bucketType, selectedService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && trends.length === 0) {
    return <PageLoading />;
  }

  if (error && trends.length === 0) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <div>
      <Header
        title="Trends"
        description="Log volume and error rate analytics"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
            Time Range
          </label>
          <select
            className="select"
            value={bucketType}
            onChange={(e) => setBucketType(e.target.value as 'HOUR' | 'DAY')}
          >
            <option value="HOUR">Last 24 Hours (Hourly)</option>
            <option value="DAY">Last 7 Days (Daily)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
            Service
          </label>
          <select
            className="select"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Stats */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <StatCard
            title="Total Logs (Today)"
            value={comparison.current.totalLogs}
            icon={Activity}
            change={comparison.changePercent.totalLogs}
            changeLabel="vs yesterday"
            accent="cyan"
          />
          <StatCard
            title="Errors (Today)"
            value={comparison.current.errorCount}
            icon={AlertTriangle}
            change={comparison.changePercent.errorCount}
            changeLabel="vs yesterday"
            accent="rose"
          />
          <StatCard
            title="Error Rate (Today)"
            value={comparison.current.errorRate}
            format="percent"
            icon={comparison.changePercent.errorRate > 0 ? TrendingUp : TrendingDown}
            change={comparison.changePercent.errorRate}
            changeLabel="vs yesterday"
            accent="amber"
          />
          <StatCard
            title="Logs (Yesterday)"
            value={comparison.previous.totalLogs}
            icon={Activity}
            accent="indigo"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Log Volume Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-medium uppercase tracking-wider text-[--text-tertiary]">Log Volume</h2>
          </div>
          <div className="card-content">
            {trends.length > 0 ? (
              <LogVolumeChart data={trends} bucketType={bucketType} height={300} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-[--text-tertiary]">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Error Rate Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-medium uppercase tracking-wider text-[--text-tertiary]">Error Rate</h2>
          </div>
          <div className="card-content">
            {trends.length > 0 ? (
              <ErrorRateChart data={trends} bucketType={bucketType} height={300} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-[--text-tertiary]">
                No trend data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Metrics */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[--text-tertiary]">Errors by Service</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div>
              {serviceMetrics.length > 0 ? (
                <ServiceMetricsChart
                  data={serviceMetrics}
                  metric="errorCount"
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-[--text-tertiary]">
                  No service data available
                </div>
              )}
            </div>

            {/* Table */}
            <div>
              {serviceMetrics.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Errors</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceMetrics.slice(0, 10).map((metric) => (
                      <tr key={metric.service}>
                        <td className="font-medium">{metric.service}</td>
                        <td className="text-right">
                          {formatNumber(metric.totalLogs)}
                        </td>
                        <td className="text-right">
                          {formatNumber(metric.errorCount)}
                        </td>
                        <td className="text-right">
                          {formatPercent(metric.errorRate)}
                        </td>
                        <td
                          className={`text-right ${
                            metric.trendDirection === 'up'
                              ? 'text-danger-400'
                              : metric.trendDirection === 'down'
                              ? 'text-success-400'
                              : 'text-[--text-tertiary]'
                          }`}
                        >
                          {metric.trendDirection === 'up'
                            ? '↑'
                            : metric.trendDirection === 'down'
                            ? '↓'
                            : '→'}{' '}
                          {formatPercent(Math.abs(metric.changePercent))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-[--text-tertiary]">
                  No service data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
