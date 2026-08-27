import type { Metadata, Viewport } from 'next';
import './globals.css';
import React from 'react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Vertex Central Admin Portal | Multi-Channel Automation',
    template: '%s | Vertex Admin',
  },
  description: 'Enterprise AI conversation automation, channel management, client configurations, and analytics orchestrator.',
  keywords: ['Vertex Admin', 'Multi-Channel AI', 'Conversation Automation', 'n8n Workflows', 'Supabase Realtime'],
  authors: [{ name: 'Vertex Systems' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'Vertex Central Admin Portal',
    description: 'Enterprise multi-channel AI conversation and CRM automation orchestrator.',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
