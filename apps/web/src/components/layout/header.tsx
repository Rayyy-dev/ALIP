'use client';

import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  actions?: React.ReactNode;
}

export function Header({
  title,
  description,
  onRefresh,
  isLoading,
  actions,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 pb-5 border-b border-[--border-subtle]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="text-sm text-[--text-tertiary] mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg text-[--text-disabled] hover:text-[--text-secondary] hover:bg-white/[0.04] transition-all disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
