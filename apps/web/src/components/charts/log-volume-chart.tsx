'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatChartDate } from '@/lib/utils';

interface TrendData {
  bucketStart: string;
  totalLogs: number;
  infoCount: number;
  warnCount: number;
  errorCount: number;
}

interface LogVolumeChartProps {
  data: TrendData[];
  bucketType?: 'HOUR' | 'DAY';
  height?: number;
  stacked?: boolean;
}

export function LogVolumeChart({
  data,
  bucketType = 'HOUR',
  height = 300,
  stacked = true,
}: LogVolumeChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatChartDate(point.bucketStart, bucketType),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#253850" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#a3b3c9' }}
          tickLine={false}
          axisLine={{ stroke: '#253850' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#a3b3c9' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#253850',
            border: '1px solid #304a65',
            borderRadius: '8px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
            color: '#f8fafc',
          }}
          labelStyle={{ color: '#a3b3c9', fontSize: 11 }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Legend
          wrapperStyle={{ color: '#a3b3c9', fontSize: 11, paddingTop: 8 }}
        />
        <Bar
          dataKey="infoCount"
          name="Info"
          stackId={stacked ? 'stack' : undefined}
          fill="#818cf8"
          radius={stacked ? undefined : [3, 3, 0, 0]}
          animationBegin={0}
          animationDuration={800}
        />
        <Bar
          dataKey="warnCount"
          name="Warning"
          stackId={stacked ? 'stack' : undefined}
          fill="#fbbf24"
          radius={stacked ? undefined : [3, 3, 0, 0]}
          animationBegin={100}
          animationDuration={800}
        />
        <Bar
          dataKey="errorCount"
          name="Error"
          stackId={stacked ? 'stack' : undefined}
          fill="#f43f5e"
          radius={stacked ? [3, 3, 0, 0] : [3, 3, 0, 0]}
          animationBegin={200}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
