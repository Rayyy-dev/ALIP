'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  message = 'Something went wrong',
  onRetry,
  className,
}: ErrorDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="p-4 bg-danger-500/10 rounded-full mb-4">
        <AlertTriangle className="w-8 h-8 text-danger-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">Error</h3>
      <p className="text-sm text-[--text-tertiary] text-center max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
