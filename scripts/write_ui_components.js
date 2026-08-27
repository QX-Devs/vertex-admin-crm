const fs = require('fs');
const path = require('path');

function ensureAndWrite(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Wrote:', filePath);
}

// 1. app/layout.tsx
ensureAndWrite('app/layout.tsx', `'use client';

import './globals.css';
import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
`);

// 2. app/page.tsx
ensureAndWrite('app/page.tsx', `'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium">???? ???????...</p>
      </div>
    </div>
  );
}
`);

// 3. components/ui/StatusBadge.tsx
ensureAndWrite('components/ui/StatusBadge.tsx', `import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const s = String(status || '').toLowerCase();

  let color = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = status;

  if (s === 'active' || s === 'connected' || s === 'completed' || s === 'converted' || s === 'confirmed') {
    color = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50';
    label = s === 'active' ? '???' : s === 'connected' ? '????' : s === 'confirmed' ? '????' : s === 'converted' ? '?????' : '?????';
  } else if (s === 'paused' || s === 'pending' || s === 'waiting' || s === 'contacted' || s === 'validating') {
    color = 'bg-amber-950/80 text-amber-300 border-amber-700/50';
    label = s === 'paused' ? '????? ??????' : s === 'pending' ? '??? ????????' : s === 'contacted' ? '?? ???????' : s === 'validating' ? '???? ??????' : '??????';
  } else if (s === 'suspended' || s === 'invalid_credentials' || s === 'expired' || s === 'failed' || s === 'lost' || s === 'cancelled') {
    color = 'bg-rose-950/80 text-rose-300 border-rose-700/50';
    label = s === 'suspended' ? '?????' : s === 'expired' ? '????? ????????' : s === 'invalid_credentials' ? '?????? ??? ?????' : s === 'failed' ? '???' : s === 'cancelled' ? '????' : '?????';
  } else if (s === 'new' || s === 'qualified' || s === 'booked' || s === 'in_progress') {
    color = 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50';
    label = s === 'new' ? '????' : s === 'qualified' ? '????' : s === 'booked' ? '?????' : '??? ???????';
  } else if (s === 'not_connected' || s === 'disconnected') {
    color = 'bg-slate-900 text-slate-400 border-slate-800';
    label = '??? ????';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={\`inline-flex items-center font-medium rounded-full border \${px} \${color}\`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 ml-1 inline-block opacity-80" />
      {label}
    </span>
  );
}
`);

// 4. components/layout/AdminSidebar.tsx
ensureAndWrite('components/layout/AdminSidebar.tsx', `'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCheck,
  CalendarCheck,
  Layers,
  BarChart3,
  Network,
  ShieldCheck,
  Activity,
  LogOut,
  Bot
} from 'lucide-react';

const NAV_ITEMS = [
  { label: '???? ???????', href: '/dashboard', icon: LayoutDashboard },
  { label: '???????', href: '/clients', icon: Users },
  { label: '?????????', href: '/conversations', icon: MessageSquare },
  { label: '??????? ?????????', href: '/leads', icon: UserCheck },
  { label: '???????? ????????', href: '/orders', icon: CalendarCheck },
  { label: '??????? ??????', href: '/plans', icon: Layers },
  { label: '????????? ?????????', href: '/usage', icon: BarChart3 },
  { label: '??????? ??????????', href: '/integrations', icon: Network },
  { label: '??? ????????', href: '/audit-log', icon: ShieldCheck },
  { label: '???? ??????', href: '/health', icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 tracking-wide">???? ????? ???????</h1>
          <p className="text-[11px] text-emerald-400 font-medium">???? ?????? ????????</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          ??????? ????????
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all \${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }\`}
            >
              <Icon className={\`h-4 w-4 shrink-0 \${isActive ? 'text-emerald-400' : 'text-slate-400'}\`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
            AD
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-200">?????? ?????</p>
            <p className="text-[10px] text-slate-400">admin@example.com</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="????? ??????"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
`);

// 5. components/layout/AdminHeader.tsx
ensureAndWrite('components/layout/AdminHeader.tsx', `'use client';

import React from 'react';
import { Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actions}

        {/* Live Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>?????? ???</span>
        </div>
      </div>
    </header>
  );
}
`);

// 6. components/layout/MetricCard.tsx
ensureAndWrite('components/layout/MetricCard.tsx', `import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'indigo';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'positive',
  color = 'emerald',
}: MetricCardProps) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/30',
    cyan: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/30',
    amber: 'text-amber-400 bg-amber-950/50 border-amber-800/30',
    rose: 'text-rose-400 bg-rose-950/50 border-rose-800/30',
    indigo: 'text-indigo-400 bg-indigo-950/50 border-indigo-800/30',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
        </div>
        <div className={\`p-3 rounded-xl border \${colorMap[color]}\`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && (
            <span
              className={\`font-semibold \${
                trendType === 'positive'
                  ? 'text-emerald-400'
                  : trendType === 'negative'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }\`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
`);

// 7. app/(admin)/layout.tsx
ensureAndWrite('app/(admin)/layout.tsx', `'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        setLoading(false);
      } catch (err) {
        router.replace('/login');
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium">?????? ?? ???? ??????...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
`);

// 8. app/(auth)/login/page.tsx
ensureAndWrite('app/(auth)/login/page.tsx', `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '??? ????? ??????');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '??? ??? ????? ????? ??????');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 select-none relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 mb-4">
            <Bot className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">????? ?????? ???????</h1>
          <p className="text-xs text-slate-400 mt-1">???? ????? ????????? ?????? ??????? ?????????</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-950/80 border border-rose-800/50 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">?????? ??????????</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="admin@example.com"
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">???? ??????</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>???? ??????</span>
                <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400">???? ?????? ???????:</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">admin@example.com / Admin@123456</p>
        </div>
      </div>
    </div>
  );
}
`);

console.log('Core layout and auth pages created successfully');
