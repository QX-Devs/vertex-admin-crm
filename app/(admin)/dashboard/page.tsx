'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { MetricCard } from '@/components/layout/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  MessageSquare,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  TrendingUp,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading platform statistics...</p>
        </div>
      </div>
    );
  }

  const { platform, usage, alerts, recentActivity } = stats;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Dashboard & Platform Overview"
        subtitle="Live metrics on tenant activity, multi-channel connections, and AI pipeline operations"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Section 1: Platform High-Level Metrics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Platform Metrics Overview
            </h3>
            <span className="text-[11px] text-slate-400">Auto-refreshes every 15s</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Subscribed Clients"
              value={platform.totalClients}
              subtitle={`${platform.activeClients} Active • ${platform.pausedClients} Paused • ${platform.suspendedClients} Suspended`}
              icon={Users}
              color="emerald"
            />
            <MetricCard
              title="Total Conversations"
              value={platform.totalConversations}
              subtitle={`Today: ${platform.conversationsToday} • This Week: ${platform.conversationsThisWeek}`}
              icon={MessageSquare}
              color="cyan"
            />
            <MetricCard
              title="Qualified Leads"
              value={platform.totalLeads}
              subtitle={`Today: ${platform.leadsToday} • This Week: ${platform.leadsThisWeek}`}
              icon={UserCheck}
              color="indigo"
            />
            <MetricCard
              title="Confirmed Bookings & Orders"
              value={platform.confirmedOrders}
              subtitle="Automated via conversational AI"
              icon={CalendarCheck}
              color="emerald"
            />
          </div>
        </div>

        {/* Section 2: Channel Connectivity & Operations Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300">Social Channel Connectivity</h4>
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-300 font-medium">WhatsApp Cloud API</span>
                <span className="text-xs font-bold text-emerald-400">{platform.connectedWhatsApp} Connected</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-300 font-medium">Facebook Messenger</span>
                <span className="text-xs font-bold text-emerald-400">{platform.connectedFacebook} Connected</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-300 font-medium">Instagram Direct</span>
                <span className="text-xs font-bold text-emerald-400">{platform.connectedInstagram} Connected</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300">Monthly Message Consumption</h4>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-100 mt-2">
              {usage.totalMonthlyMessages.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-2">messages this month</span>
            </p>
            {(() => {
              const total = usage.totalMonthlyMessages || 0;
              const waCount = usage.usageByChannel?.find((c: any) => c.channel === 'whatsapp')?.count || 0;
              const igCount = usage.usageByChannel?.find((c: any) => c.channel === 'instagram')?.count || 0;
              const fbCount = usage.usageByChannel?.find((c: any) => c.channel === 'messenger')?.count || 0;
              const sumChannel = waCount + igCount + fbCount;
              const base = sumChannel > 0 ? sumChannel : (total > 0 ? total : 0);

              const waPct = base > 0 ? Math.round((waCount / base) * 100) : 0;
              const igPct = base > 0 ? Math.round((igCount / base) * 100) : 0;
              const fbPct = base > 0 ? Math.max(0, 100 - waPct - igPct) : 0;

              return (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Distribution</span>
                    {base > 0 ? (
                      <span className="text-slate-300">
                        WhatsApp {waPct}% • Instagram {igPct}% • Messenger {fbPct}%
                      </span>
                    ) : (
                      <span className="text-slate-500">No message traffic this month</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                    {base > 0 ? (
                      <>
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${waPct}%` }} />
                        <div className="bg-pink-500 h-full transition-all" style={{ width: `${igPct}%` }} />
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${fbPct}%` }} />
                      </>
                    ) : (
                      <div className="bg-slate-800 h-full w-full" />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300">Human Handoff & Escalations</h4>
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
                <p className="text-xl font-bold text-amber-400">{platform.openHumanHandoffs}</p>
                <p className="text-[11px] text-slate-400 mt-1">Pending Human Handoffs</p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
                <p className="text-xl font-bold text-rose-400">{platform.failedIntegrations}</p>
                <p className="text-[11px] text-slate-400 mt-1">Channel Auth Errors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Operational Alerts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operational Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h4 className="text-sm font-bold text-slate-200">Live Operational Alerts</h4>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/40">
                {alerts.length} Alerts
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-80">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No operational alerts currently. All systems and channels are healthy.
                </div>
              ) : (
                alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border ${
                      alert.type === 'error'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold">{alert.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{alert.message}</p>
                    {alert.clientId && (
                      <Link
                        href={`/clients/${alert.clientId}`}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 mt-2"
                      >
                        <span>Open Client Profile</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-200">Recent Event Stream</h4>
              </div>
              <span className="text-xs text-slate-400">Live</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-80">
              {recentActivity.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        act.type === 'order'
                          ? 'bg-emerald-400'
                          : act.type === 'lead'
                          ? 'bg-cyan-400'
                          : act.type === 'audit'
                          ? 'bg-purple-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{act.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{act.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
