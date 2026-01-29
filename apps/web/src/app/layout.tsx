import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LayoutShell } from '@/components/layout/layout-shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ALIP - Automated Log Intelligence Platform',
  description: 'Monitor, analyze, and manage application logs with intelligent insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[--background] text-[--text-secondary] antialiased`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
