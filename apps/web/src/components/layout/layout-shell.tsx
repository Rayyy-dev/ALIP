'use client';

import { useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './sidebar';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(true)} />
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed top-4 left-[4.5rem] z-40 p-1.5 rounded-md bg-[--surface] border border-[--border-subtle] text-[--text-disabled] hover:text-[--text-secondary] hover:border-[--border-default] transition-colors shadow-md"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
      <main
        className="p-6 lg:p-8 overflow-auto transition-[margin] duration-200 ease-in-out"
        style={{ marginLeft: collapsed ? '4rem' : '16rem' }}
      >
        {children}
      </main>
    </div>
  );
}
