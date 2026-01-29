'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main
        className="p-6 lg:p-8 overflow-auto transition-[margin] duration-200 ease-in-out"
        style={{ marginLeft: collapsed ? '4rem' : '16rem' }}
      >
        {children}
      </main>
    </div>
  );
}
