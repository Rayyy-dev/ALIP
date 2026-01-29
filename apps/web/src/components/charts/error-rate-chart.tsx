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
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3e55" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#b0bdd0' }}
          tickLine={false}
          axisLine={{ stroke: '#2e3e55' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#b0bdd0' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
          domain={[0, 'auto']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#2e3c52',
            border: '1px solid #3a4e6a',
            borderRadius: '8px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
            color: '#f8fafc',
          }}
          labelStyle={{ color: '#b0bdd0', fontSize: 11 }}
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
          activeDot={{ r: 5, fill: '#f43f5e', stroke: '#2e3e55', strokeWidth: 2 }}
          animationBegin={0}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
