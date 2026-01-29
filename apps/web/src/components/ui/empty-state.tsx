'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="p-4 bg-white/[0.04] rounded-full mb-4">
        <Icon className="w-8 h-8 text-[--text-disabled]" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[--text-tertiary] text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
