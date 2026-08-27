const fs = require('fs');
const path = require('path');

function ensureAndWrite(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Wrote:', filePath);
}

// 1. app/(admin)/dashboard/page.tsx
ensureAndWrite('app/(admin)/dashboard/page.tsx', `'use client';

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
          <p className="text-xs text-slate-400">???? ????? ???????? ??????...</p>
        </div>
      </div>
    );
  }

  const { platform, usage, alerts, recentActivity } = stats;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="???? ??????? ????????"
        subtitle="???? ???? ??? ?????? ??? ??? ??????? ?????????? ?????????"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Section 1: Platform High-Level Metrics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              ???????? ?????? ??????
            </h3>
            <span className="text-[11px] text-slate-400">????? ?????? ?? 15 ?????</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="?????? ??????? ?????????"
              value={platform.totalClients}
              subtitle={\`\${platform.activeClients} ??? • \${platform.pausedClients} ????? • \${platform.suspendedClients} ????\`}
              icon={Users}
              color="emerald"
            />
            <MetricCard
              title="????????? ???????"
              value={platform.totalConversations}
              subtitle={\`?????: \${platform.conversationsToday} • ??? ?????: \${platform.conversationsThisMonth}\`}
              icon={MessageSquare}
              color="cyan"
            />
            <MetricCard
              title="??????? ????????? (Leads)"
              value={platform.totalLeads}
              subtitle={\`?????: \${platform.leadsToday} ???? ????\`}
              icon={UserCheck}
              color="indigo"
            />
            <MetricCard
              title="???????? ???????? ???????"
              value={platform.confirmedOrders}
              subtitle="????? ??? ?????? ??? ?????? ?????????"
              icon={CalendarCheck}
              color="emerald"
            />
          </div>
        </div>

        {/* Section 2: Channel Connectivity & Operations Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300">??????? ??????? ???????</h4>
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-300 font-medium">WhatsApp Cloud API</span>
                <span className="text-xs font-bold text-emerald-400">{platform.connectedWhatsApp} ????</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-300 font-medium">Facebook Messenger</span>
                <span className="text-xs font-bold text-emerald-400">{platform.connectedFacebook} ????</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-300 font-medium">Instagram Direct</span>
                <span className="text-xs font-bold text-emerald-400">{platform.connectedInstagram} ????</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300">????????? ?????? ?????</h4>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-100 mt-2">
              {usage.totalMonthlyMessages.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 mr-2">????? / ??? ?????</span>
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-slate-400 flex justify-between">
                <span>????? ???????</span>
                <span className="text-slate-300">?????? 85% • ???????? 10% • ?????? 5%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[85%]" />
                <div className="bg-pink-500 h-full w-[10%]" />
                <div className="bg-blue-500 h-full w-[5%]" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300">????? ?????? ?????? ??????????</h4>
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
                <p className="text-xl font-bold text-amber-400">{platform.openHumanHandoffs}</p>
                <p className="text-[11px] text-slate-400 mt-1">??? ???? ????</p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
                <p className="text-xl font-bold text-rose-400">{platform.failedIntegrations}</p>
                <p className="text-[11px] text-slate-400 mt-1">????? ??? ?????</p>
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
                <h4 className="text-sm font-bold text-slate-200">????????? ????????? ??????</h4>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/40">
                {alerts.length} ?????
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-80">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  ?? ???? ?? ??????? ??????? ?????. ???? ??????? ???? ???? ????.
                </div>
              ) : (
                alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={\`p-3.5 rounded-xl border \${
                      alert.type === 'error'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    }\`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold">{alert.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(alert.timestamp).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{alert.message}</p>
                    {alert.clientId && (
                      <Link
                        href={\`/clients/\${alert.clientId}\`}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 mt-2"
                      >
                        <span>??? ??? ??????</span>
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
                <h4 className="text-sm font-bold text-slate-200">??? ??????? ???????</h4>
              </div>
              <span className="text-xs text-slate-400">?????</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-80">
              {recentActivity.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={\`h-2 w-2 rounded-full mt-1.5 shrink-0 \${
                        act.type === 'order'
                          ? 'bg-emerald-400'
                          : act.type === 'lead'
                          ? 'bg-cyan-400'
                          : act.type === 'audit'
                          ? 'bg-purple-400'
                          : 'bg-slate-400'
                      }\`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{act.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{act.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
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
`);

// 2. app/(admin)/clients/page.tsx
ensureAndWrite('app/(admin)/clients/page.tsx', `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Play,
  Pause,
  ShieldX,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    setActionLoading(clientId);
    try {
      const res = await fetch(\`/api/admin/clients/\${clientId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUpdates: { status: newStatus }
        })
      });
      if (res.ok) {
        await fetchClients();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchSearch =
      c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_phone?.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchPlan = planFilter === 'all' || c.plan_id === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="????? ??????? ????????"
        subtitle="?????? ?????? ?? ?????? ???????? ??? ????????? ?????? ???????"
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="??? ???? ??????? ??????? ?? ??????..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">???? ???????</option>
              <option value="active">???</option>
              <option value="paused">????? ??????</option>
              <option value="suspended">?????</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">???? ???????</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <button
              onClick={fetchClients}
              title="????? ????????"
              className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4">??? ?????? / ??????</th>
                  <th className="p-4">???? ?????? (ID)</th>
                  <th className="p-4">??????</th>
                  <th className="p-4">??????</th>
                  <th className="p-4">???????</th>
                  <th className="p-4">????????? ??????</th>
                  <th className="p-4">??????? ????????</th>
                  <th className="p-4 text-left">?????????</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      ???? ????? ????? ???????...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      ?? ??? ?????? ??? ?? ????? ??????? ?????? ?????.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.client_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{client.business_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{client.owner_phone}</div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-300">
                        {client.client_id}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-200">{client.plan_name || client.plan_id}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            title="WhatsApp"
                            className={\`px-2 py-0.5 rounded text-[10px] font-semibold \${
                              client.whatsapp_status === 'CONNECTED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }\`}
                          >
                            WA
                          </span>
                          <span
                            title="Facebook Messenger"
                            className={\`px-2 py-0.5 rounded text-[10px] font-semibold \${
                              client.facebook_status === 'CONNECTED'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }\`}
                          >
                            FB
                          </span>
                          <span
                            title="Instagram"
                            className={\`px-2 py-0.5 rounded text-[10px] font-semibold \${
                              client.instagram_status === 'CONNECTED'
                                ? 'bg-pink-950 text-pink-400 border border-pink-800'
                                : client.instagram_status === 'EXPIRED'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }\`}
                          >
                            IG
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{client.used_chats || 0}</span>
                            <span>{client.monthly_limit || 1000}</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={\`h-full rounded-full \${
                                (client.usage_percentage || 0) >= 90
                                  ? 'bg-rose-500'
                                  : (client.usage_percentage || 0) >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }\`}
                              style={{ width: \`\${Math.min(100, client.usage_percentage || 0)}%\` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        <span className="font-semibold text-cyan-400">{client.leads_count || 0}</span> ???? ????? •{' '}
                        <span className="font-semibold text-emerald-400">{client.orders_count || 0}</span> ???
                      </td>
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          {client.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(client.client_id, 'paused')}
                              disabled={actionLoading === client.client_id}
                              title="????? ????"
                              className="p-1.5 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:bg-amber-900/60"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(client.client_id, 'active')}
                              disabled={actionLoading === client.client_id}
                              title="????? ??????"
                              className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <Link
                            href={\`/clients/\${client.client_id}\`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                          >
                            <span>????????</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
`);

console.log('Dashboard and Clients list pages written successfully');
