'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorTimelineChart } from '@/components/charts/error-timeline-chart';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { getOverviewStats, getTopErrors } from '@/lib/api';
import { formatNumber, formatPercent, formatRelativeTime, truncate } from '@/lib/utils';
import { Activity, AlertTriangle, Bell, Layers } from 'lucide-react';
import Link from 'next/link';

interface OverviewData {
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
}

interface TopError {
  id: string;
  normalizedMessage: string;
  service: string;
  level: string;
  occurrenceCount: number;
  lastSeen: string;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewData | null>(null);
  const [topErrors, setTopErrors] = useState<TopError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, errorsData] = await Promise.all([
        getOverviewStats(),
        getTopErrors(5),
      ]);

      setStats(statsData);
      setTopErrors(errorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !stats) {
    return <PageLoading />;
  }

  if (error && !stats) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  const errorRateChange = stats
    ? ((stats.errorRate24h - stats.errorRate7d / 7) / (stats.errorRate7d / 7 || 1)) * 100
    : 0;

  return (
    <div>
      <Header
        title="Overview"
        description="Real-time log intelligence and error monitoring"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="animate-fade-in h-full">
          <StatCard
            title="Total Logs (24h)"
            value={stats?.totalLogs24h || 0}
            icon={Activity}
            format="number"
            accent="cyan"
          />
        </div>
        <div className="animate-fade-in-delay-1 h-full">
          <StatCard
            title="Error Rate (24h)"
            value={stats?.errorRate24h || 0}
            icon={AlertTriangle}
            format="percent"
            change={errorRateChange}
            changeLabel="vs avg"
            accent="rose"
          />
        </div>
        <div className="animate-fade-in-delay-2 h-full">
          <StatCard
            title="Active Alerts"
            value={stats?.activeAlerts || 0}
            icon={Bell}
            format="number"
            accent="amber"
          />
        </div>
        <div className="animate-fade-in-delay-3 h-full">
          <StatCard
            title="Error Groups"
            value={stats?.activeErrorGroups || 0}
            icon={Layers}
            format="number"
            accent="indigo"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        {/* Error Timeline */}
        <div className="lg:col-span-2 card animate-fade-in">
          <div className="card-header">
            <h2 className="text-sm font-medium uppercase tracking-wider text-[--text-tertiary]">Error Timeline (24h)</h2>
          </div>
          <div className="card-content">
            {stats?.recentTrend && stats.recentTrend.length > 0 ? (
              <ErrorTimelineChart data={stats.recentTrend} height={250} />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-[--text-tertiary]">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="card animate-fade-in">
          <div className="card-header">
            <h2 className="text-sm font-medium uppercase tracking-wider text-[--text-tertiary]">Top Services by Errors</h2>
          </div>
          <div className="card-content">
            {stats?.topServices && stats.topServices.length > 0 ? (
              <ul className="space-y-1">
                {stats.topServices.map((service) => (
                  <li
                    key={service.service}
                    className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-[--surface-hover] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">{service.service}</p>
                      <p className="text-xs text-[--text-tertiary]">
                        {formatNumber(service.errorCount)} errors
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatPercent(service.errorRate)}
                      </p>
                      <p
                        className={`text-xs ${
                          service.trendDirection === 'up'
                            ? 'text-danger-400'
                            : service.trendDirection === 'down'
                            ? 'text-success-400'
                            : 'text-[--text-tertiary]'
                        }`}
                      >
                        {service.trendDirection === 'up'
                          ? '↑'
                          : service.trendDirection === 'down'
                          ? '↓'
                          : '→'}{' '}
                        {formatPercent(Math.abs(service.changePercent))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[--text-tertiary] text-center py-4">No service data</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Recurring Errors */}
      <div className="card animate-fade-in">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[--text-tertiary]">Top Recurring Errors</h2>
          <Link href="/errors" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            View all
          </Link>
        </div>
        <div className="card-content p-0">
          {topErrors.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Error</th>
                  <th>Service</th>
                  <th>Level</th>
                  <th className="text-right">Count</th>
                  <th className="text-right">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {topErrors.map((error) => (
                  <tr key={error.id}>
                    <td className="max-w-md">
                      <Link
                        href={`/errors?id=${error.id}`}
                        className="text-[--text-secondary] hover:text-primary-300 transition-colors"
                      >
                        {truncate(error.normalizedMessage, 60)}
                      </Link>
                    </td>
                    <td>
                      <span className="text-sm text-[--text-tertiary]">{error.service}</span>
                    </td>
                    <td>
                      <Badge variant="level" level={error.level}>
                        {error.level}
                      </Badge>
                    </td>
                    <td className="text-right font-medium text-white">
                      {formatNumber(error.occurrenceCount)}
                    </td>
                    <td className="text-right text-sm text-[--text-tertiary]">
                      {formatRelativeTime(error.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[--text-tertiary] text-center py-8">No error groups found</p>
          )}
        </div>
      </div>
    </div>
  );
}
