import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a number as a percentage
 */
export function formatPercent(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (includeTime) {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date for chart axis
 */
export function formatChartDate(date: Date | string, bucketType: 'HOUR' | 'DAY'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (bucketType === 'HOUR') {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get color for log level
 */
export function getLevelColor(level: string): string {
  switch (level) {
    case 'INFO':
      return 'text-primary-300 bg-primary-500/10 border border-primary-500/15';
    case 'WARN':
      return 'text-warning-300 bg-warning-500/10 border border-warning-500/15';
    case 'ERROR':
      return 'text-danger-300 bg-danger-500/10 border border-danger-500/15';
    default:
      return 'text-gray-400 bg-white/5 border border-white/10';
  }
}

/**
 * Get color for status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-danger-300 bg-danger-500/10 border border-danger-500/15';
    case 'ACKNOWLEDGED':
      return 'text-warning-300 bg-warning-500/10 border border-warning-500/15';
    case 'RESOLVED':
      return 'text-success-300 bg-success-500/10 border border-success-500/15';
    case 'IGNORED':
      return 'text-gray-400 bg-white/5 border border-white/10';
    default:
      return 'text-gray-400 bg-white/5 border border-white/10';
  }
}

/**
 * Get color for trend direction
 */
export function getTrendColor(direction: 'up' | 'down' | 'stable'): string {
  switch (direction) {
    case 'up':
      return 'text-danger-400';
    case 'down':
      return 'text-success-400';
    case 'stable':
      return 'text-gray-400';
  }
}

/**
 * Get icon for trend direction
 */
export function getTrendIcon(direction: 'up' | 'down' | 'stable'): string {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'stable':
      return '→';
  }
}

/**
 * Calculate percentage change
 */
export function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
