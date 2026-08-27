'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  Search,
  Filter,
  RefreshCw,
  Layers,
  Radio,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function UsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading quota and usage analytics...</p>
        </div>
      </div>
    );
  }

  const { usage } = stats;
  const filteredClients = (usage.usageByClient || []).filter((c: any) =>
    c.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    c.clientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Usage & Quota Analytics"
        subtitle="Monitor multi-tenant message consumption, identify quota bottlenecks, and manage capacity"
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Total Monthly Volume</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-100 mt-2">
              {usage.totalMonthlyMessages.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-2">messages</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2">Combined usage across all registered tenants</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Tenants Nearing Quota (80%+)</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-amber-400 mt-2">
              {usage.clientsNearLimit?.length || 0}
              <span className="text-xs font-normal text-slate-400 ml-2">tenants</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2">Recommended for plan upgrade or top-up</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Traffic by Channel</span>
              <Radio className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="space-y-2 mt-3 text-xs">
              {(usage.usageByChannel || []).map((ch: any) => (
                <div key={ch.channel} className="flex justify-between items-center text-slate-300">
                  <span className="capitalize">{ch.channel === 'whatsapp' ? 'WhatsApp' : ch.channel === 'messenger' ? 'Messenger' : 'Instagram'}</span>
                  <span className="font-bold text-slate-100">{ch.count.toLocaleString()} messages</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Client Usage Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenant name or Client ID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Tenant / Business</th>
                  <th className="p-4">Client ID</th>
                  <th className="p-4">Used Messages</th>
                  <th className="p-4">Monthly Limit</th>
                  <th className="p-4">Usage Bar & Ratio</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No tenants found matching the search term.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client: any) => {
                    const isNear = client.percentage >= 80;
                    const isOver = client.percentage >= 100;

                    return (
                      <tr key={client.clientId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-bold text-slate-100">
                          {client.businessName}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-300">
                          {client.clientId}
                        </td>
                        <td className="p-4 font-bold text-emerald-400">
                          {client.used.toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-400">
                          {client.limit.toLocaleString()}
                        </td>
                        <td className="p-4 w-64">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-semibold text-slate-300">{client.percentage}%</span>
                              <span className="text-slate-400">
                                {Math.max(0, client.limit - client.used).toLocaleString()} remaining
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, client.percentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {isOver ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                              Exceeded Quota
                            </span>
                          ) : isNear ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                              Near Limit
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-medium">
                              Within Quota
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/clients/${client.clientId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                          >
                            <span>Details</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
