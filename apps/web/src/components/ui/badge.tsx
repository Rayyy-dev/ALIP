'use client';

import { cn, getLevelColor, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'level' | 'status';
  level?: string;
  status?: string;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  level,
  status,
  className,
}: BadgeProps) {
  const colorClass =
    variant === 'level' && level
      ? getLevelColor(level)
      : variant === 'status' && status
      ? getStatusColor(status)
      : 'bg-white/5 text-gray-400 border border-white/10';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}
