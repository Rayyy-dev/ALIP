'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatNumber } from '@/lib/utils';

interface ServiceData {
  service: string;
  errorCount: number;
  totalLogs: number;
  errorRate: number;
}

interface ServiceMetricsChartProps {
  data: ServiceData[];
  height?: number;
  metric?: 'errorCount' | 'totalLogs' | 'errorRate';
}

export function ServiceMetricsChart({
  data,
  height = 300,
  metric = 'errorCount',
}: ServiceMetricsChartProps) {
  const sortedData = [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 10);

  const getColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio > 0.7) return '#f43f5e';
    if (ratio > 0.4) return '#fbbf24';
    return '#818cf8';
  };

  const maxValue = Math.max(...sortedData.map((d) => d[metric]));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 80, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            metric === 'errorRate' ? `${value}%` : formatNumber(value)
          }
        />
        <YAxis
          type="category"
          dataKey="service"
          tick={{ fontSize: 11, fill: '#cbd5e1' }}
          tickLine={false}
          axisLine={false}
          width={70}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
            color: '#f8fafc',
          }}
          labelStyle={{ color: '#94a3b8', fontSize: 11 }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          formatter={(value: number) => [
            metric === 'errorRate' ? `${value.toFixed(1)}%` : formatNumber(value),
            metric === 'errorCount'
              ? 'Errors'
              : metric === 'totalLogs'
              ? 'Total Logs'
              : 'Error Rate',
          ]}
        />
        <Bar
          dataKey={metric}
          radius={[0, 4, 4, 0]}
          animationBegin={0}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {sortedData.map((entry, index) => (
            <Cell key={index} fill={getColor(entry[metric], maxValue)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
