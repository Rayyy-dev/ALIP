'use client';

import { cn, formatNumber, formatPercent, getTrendColor, getTrendIcon } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type AccentColor = 'indigo' | 'rose' | 'amber' | 'emerald' | 'cyan';

const accentStyles: Record<AccentColor, { bg: string; text: string; hoverBg: string }> = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', hoverBg: 'group-hover:bg-indigo-500/15' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', hoverBg: 'group-hover:bg-rose-500/15' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', hoverBg: 'group-hover:bg-amber-500/15' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', hoverBg: 'group-hover:bg-emerald-500/15' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', hoverBg: 'group-hover:bg-cyan-500/15' },
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'percent' | 'none';
  accent?: AccentColor;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  format = 'number',
  accent = 'indigo',
  className,
}: StatCardProps) {
  const colors = accentStyles[accent];
  const formattedValue = (() => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'percent':
        return formatPercent(value);
      case 'number':
        return formatNumber(value);
      default:
        return value;
    }
  })();

  const trendDirection =
    change === undefined
      ? undefined
      : change > 5
      ? 'up'
      : change < -5
      ? 'down'
      : 'stable';

  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="stat-label">{title}</p>
          <p className="stat-value">{formattedValue}</p>
          {change !== undefined && trendDirection && (
            <div
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                trendDirection === 'up'
                  ? 'bg-danger-500/10 text-danger-400'
                  : trendDirection === 'down'
                  ? 'bg-success-500/10 text-success-400'
                  : 'bg-white/5 text-gray-400'
              )}
            >
              <span>{getTrendIcon(trendDirection)}</span>
              <span>
                {change > 0 ? '+' : ''}
                {formatPercent(change)}
              </span>
              {changeLabel && (
                <span className="text-[--text-disabled] ml-0.5">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-lg transition-colors', colors.bg, colors.text, colors.hoverBg)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
