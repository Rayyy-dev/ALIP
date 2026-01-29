'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  Bell,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Error Groups', href: '/errors', icon: AlertTriangle },
  { name: 'Trends', href: '/trends', icon: TrendingUp },
  { name: 'Alerts', href: '/alerts', icon: Bell },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void; // collapses the sidebar
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'fixed top-0 left-0 flex flex-col h-screen bg-[#172035] border-r border-[--border-subtle] z-30 transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header: Logo + Toggle */}
      <div className="flex items-center justify-between border-b border-[--border-subtle] py-4 px-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-glow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white tracking-tight">ALIP</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[--text-disabled] truncate">Log Intelligence</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="shrink-0 p-1.5 rounded-md text-[--text-disabled] hover:text-[--text-secondary] hover:bg-white/[0.06] transition-colors"
            title="Collapse"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'relative flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    collapsed ? 'justify-center px-0' : 'px-3',
                    isActive
                      ? 'bg-primary-500/12 text-primary-300'
                      : 'text-[--text-disabled] hover:text-[--text-secondary] hover:bg-white/[0.04]'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-400 rounded-r-full" />
                  )}
                  <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-primary-400' : '')} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-[--border-subtle] py-3 shrink-0',
        collapsed ? 'px-2 text-center' : 'px-4'
      )}>
        <span className="text-[10px] font-mono text-[--text-disabled]">v1.0.0</span>
      </div>
    </div>
  );
}
