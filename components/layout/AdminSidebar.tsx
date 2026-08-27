'use client';

import React, { useEffect, useState } from 'react';
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
  Bot,
  Radio,
  Workflow,
  Database
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Conversations', href: '/conversations', icon: MessageSquare },
  { label: 'Leads', href: '/leads', icon: UserCheck },
  { label: 'Orders & Bookings', href: '/orders', icon: CalendarCheck },
  { label: 'Subscription Plans', href: '/plans', icon: Layers },
  { label: 'Usage & Quotas', href: '/usage', icon: BarChart3 },
  { label: 'Channel Connect', href: '/channels', icon: Radio },
  { label: 'n8n Configuration', href: '/n8n-conf', icon: Workflow },
  { label: 'Supabase Config', href: '/supabase-conf', icon: Database },
  { label: 'Integrations', href: '/integrations', icon: Network },
  { label: 'Audit Log', href: '/audit-log', icon: ShieldCheck },
  { label: 'System Health', href: '/health', icon: Activity },
];



export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const displayName = user?.name || 'Administrator';
  const displayEmail = user?.email || 'admin@session';
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 tracking-wide">Admin Portal</h1>
          <p className="text-[11px] text-emerald-400 font-medium">Multi-Tenant CRM & AI</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Core Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
            {initials}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0 ml-1"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
