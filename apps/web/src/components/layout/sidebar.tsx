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
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'fixed top-0 left-0 flex flex-col h-screen bg-[#162036] border-r border-[--border-subtle] z-30 transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-5 border-b border-[--border-subtle]">
        <div className="shrink-0 p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-glow-sm ml-0.5">
          <Activity className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white tracking-tight">ALIP</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-[--text-disabled]">Log Intelligence</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
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
                      ? 'bg-primary-500/10 text-primary-300'
                      : 'text-[--text-disabled] hover:text-[--text-secondary] hover:bg-white/[0.03]'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-400 rounded-r-full" />
                  )}
                  <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-primary-400' : '')} />
                  {!collapsed && item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle + Footer */}
      <div className="border-t border-[--border-subtle]">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-3 text-[--text-disabled] hover:text-[--text-secondary] hover:bg-white/[0.03] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <PanelLeftClose className="w-4 h-4" />
              <span>Collapse</span>
            </div>
          )}
        </button>
        <div className={cn('flex items-center px-3 py-3', collapsed ? 'justify-center' : 'justify-between')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
            {!collapsed && <span className="text-xs text-[--text-disabled]">Online</span>}
          </div>
          {!collapsed && <span className="text-[10px] font-mono text-[--text-disabled]">v1.0.0</span>}
        </div>
      </div>
    </div>
  );
}
