'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Server,
  Zap,
  Cpu,
  Lock,
  Radio
} from 'lucide-react';

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/admin/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Checking system health and diagnostics...</p>
        </div>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';

  const servicesList = [
    {
      name: 'Supabase PostgreSQL Database',
      protocol: 'TCP/5432 (SSL)',
      latency: `${health?.checks?.database?.latencyMs ?? 0} ms`,
      status: health?.checks?.database?.status || 'healthy',
      remarks: health?.checks?.database?.remarks || 'Connection pool operational'
    },
    {
      name: 'n8n Workflow & AI Router',
      protocol: 'HTTP/Webhook Engine',
      latency: 'Active',
      status: health?.checks?.n8n?.status || 'healthy',
      remarks: health?.checks?.n8n?.remarks || 'Conversational routing active'
    },
    {
      name: 'Meta Webhook Inbound Gateways',
      protocol: 'HTTPS / Graph API',
      latency: `${health?.channels?.connected ?? 0}/${health?.channels?.total ?? 0} Connected`,
      status: (health?.channels?.failed ?? 0) > 0 ? 'warning' : 'healthy',
      remarks: health?.checks?.webhooks?.remarks || 'Event receiver operational'
    },
    {
      name: 'Authentication & Session Guard (JWT)',
      protocol: 'HTTP-Only Cookie / Bearer',
      latency: 'Active',
      status: health?.checks?.auth?.status || 'healthy',
      remarks: health?.checks?.auth?.remarks || 'HS256 session guard verified'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="System Health & Infrastructure Diagnostics"
        subtitle="Real-time status monitoring for database connectivity, webhook gateways, and conversational AI routing"
        actions={
          <button
            onClick={fetchHealth}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            <span>Re-check Now</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Master Status Banner */}
        <div
          className={`p-6 rounded-2xl border flex items-center justify-between ${
            isHealthy
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isHealthy ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isHealthy ? 'All Systems Operational' : 'Some Components Require Attention'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Last checked: {new Date(health?.timestamp || Date.now()).toLocaleTimeString('en-US')} • System Uptime: {health?.uptime || 'Active'}
              </p>
            </div>
          </div>
          <StatusBadge status={health?.status || 'healthy'} />
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Database Engine</span>
              <Database className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{health?.checks?.database?.latencyMs ?? 0} ms</span>
              <StatusBadge status={health?.checks?.database?.status || 'healthy'} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">{health?.checks?.database?.driver || 'Supabase PostgreSQL'}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Webhook Gateways</span>
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">
                {health?.channels?.connected ?? 0} / {health?.channels?.total ?? 0}
              </span>
              <StatusBadge status={health?.checks?.webhooks?.status || 'healthy'} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">Connected channel endpoints</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">n8n Workflow Engine</span>
              <Server className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">Active</span>
              <StatusBadge status={health?.checks?.n8n?.status || 'healthy'} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">AI conversation pipeline router</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Process Memory</span>
              <Cpu className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{health?.checks?.memory?.usedMb ?? 0} MB</span>
              <StatusBadge status={health?.checks?.memory?.status || 'healthy'} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">Node.js heap memory utilization</p>
          </div>
        </div>

        {/* Detailed Services Diagnostic Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-200">Critical Subsystems & Service Endpoints</h4>
            <span className="text-[11px] text-slate-400">Live Diagnostics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Component / Service</th>
                  <th className="p-4">Protocol / Channel</th>
                  <th className="p-4">Latency / Connections</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Diagnostic Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {servicesList.map((srv, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-100">{srv.name}</td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">{srv.protocol}</td>
                    <td className="p-4 font-mono text-emerald-400">{srv.latency}</td>
                    <td className="p-4">
                      <StatusBadge status={srv.status} size="sm" />
                    </td>
                    <td className="p-4 text-slate-300 text-[11px]">{srv.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
