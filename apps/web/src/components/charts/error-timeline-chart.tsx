'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatChartDate } from '@/lib/utils';

interface DataPoint {
  timestamp: string;
  value: number;
}

interface ErrorTimelineChartProps {
  data: DataPoint[];
  bucketType?: 'HOUR' | 'DAY';
  height?: number;
}

export function ErrorTimelineChart({
  data,
  bucketType = 'HOUR',
  height = 300,
}: ErrorTimelineChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatChartDate(point.timestamp, bucketType),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#1e293b' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
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
          itemStyle={{ color: '#fb7185' }}
          formatter={(value: number) => [value, 'Errors']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#f43f5e"
          strokeWidth={2.5}
          fill="url(#errorGradient)"
          animationBegin={0}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
