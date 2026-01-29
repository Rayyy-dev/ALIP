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
import { formatChartDate, formatPercent } from '@/lib/utils';

interface TrendData {
  bucketStart: string;
  errorRate: number;
}

interface ErrorRateChartProps {
  data: TrendData[];
  bucketType?: 'HOUR' | 'DAY';
  height?: number;
}

export function ErrorRateChart({
  data,
  bucketType = 'HOUR',
  height = 300,
}: ErrorRateChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatChartDate(point.bucketStart, bucketType),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
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
          tickFormatter={(value) => `${value}%`}
          domain={[0, 'auto']}
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
          formatter={(value: number) => [formatPercent(value), 'Error Rate']}
        />
        <Area
          type="monotone"
          dataKey="errorRate"
          stroke="#f43f5e"
          strokeWidth={2.5}
          fill="url(#rateGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#f43f5e', stroke: '#1e293b', strokeWidth: 2 }}
          animationBegin={0}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
