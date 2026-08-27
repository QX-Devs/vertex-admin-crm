const fs = require('fs');

// 1. Integrations Page
const integrationsContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Network,
  RefreshCw,
  Lock,
  Database,
  Workflow
} from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/admin/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="??????? ?????????? ?????? (Integrations Overview)"
        subtitle="???? ???? ??? ????? ??????? ?????????? ???? ??? ????? n8n? ?????? ????????"
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-xs text-slate-300">
            ???? ??????: ??? ????? ?????? ????????? ??????? ?? ?????? ??? ??? ??????. ?? ??? ??? ?????? ?????? ?? ?????? API ??? ??? ???????.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">???? ??? ????? (n8n Workflow Engine)</h4>
                  <p className="text-[11px] text-slate-400">88 ???? ???? ????? ????? ??????? ??????? ?????????</p>
                </div>
              </div>
              <StatusBadge status="active" size="sm" />
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
              <span>???? ??? Webhook:</span>
              <span className="font-mono text-slate-200">/webhook/admin/channel/validate</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">????? ???????? (PostgreSQL / Supabase)</h4>
                  <p className="text-[11px] text-slate-400">???? ???????? ?????? ????????? ?????? ??????? ???????</p>
                </div>
              </div>
              <StatusBadge status="connected" size="sm" />
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
              <span>???? ???????:</span>
              <span className="text-emerald-400 font-semibold">???? ?????? (Healthy)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-200">????? ??????? ???????? ({integrations.length})</h3>
            <button onClick={fetchIntegrations} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>????? ???????</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">??????</th>
                  <th className="p-4">???? ?????? (Client ID)</th>
                  <th className="p-4">??? ?????? ???????</th>
                  <th className="p-4">???? ??????</th>
                  <th className="p-4">???? ??? Webhook</th>
                  <th className="p-4">??? ????</th>
                  <th className="p-4">???? ????? ?? ???</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {integrations.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-100 capitalize">{i.platform}</td>
                    <td className="p-4 font-mono text-slate-300 text-[11px]">{i.client_id}</td>
                    <td className="p-4 text-slate-200">{i.external_account_name || '—'}</td>
                    <td className="p-4">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="p-4 text-emerald-400">{i.webhook_status || '??? ????'}</td>
                    <td className="p-4 text-slate-400">
                      {i.last_validated_at ? new Date(i.last_validated_at).toLocaleString('ar-JO') : '—'}
                    </td>
                    <td className="p-4 text-rose-400 text-[11px]">{i.last_error || '—'}</td>
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
`;
fs.writeFileSync('app/(admin)/integrations/page.tsx', integrationsContent, 'utf8');

// 2. Audit Log Page
const auditContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import {
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-log');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="??? ???????? ???????? (Audit Log)"
        subtitle="??? ??? ???? ??????? ???? ???? ?????????? ?????????? ??????? ??????? ??????? ????????"
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-200">???????? ???????? ??????? ({logs.length})</h3>
            <button onClick={fetchLogs} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>????? ?????</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">?????? / ????????</th>
                  <th className="p-4">??? ???????</th>
                  <th className="p-4">?????? ????????</th>
                  <th className="p-4">???? ??????</th>
                  <th className="p-4">???????</th>
                  <th className="p-4">????? IP</th>
                  <th className="p-4">????? ????????</th>
                  <th className="p-4 text-left">?????? ?????? (Diff)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{log.admin_email}</div>
                    </td>
                    <td className="p-4 font-semibold text-emerald-400">{log.action}</td>
                    <td className="p-4 text-slate-300">{log.entity}</td>
                    <td className="p-4 font-mono text-slate-400">{log.entity_id}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        {log.result}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-4 text-slate-400">{new Date(log.created_at).toLocaleString('ar-JO')}</td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                      >
                        ?????? ????????
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl space-y-4">
              <h3 className="font-bold text-sm text-slate-100">
                ?????? ??????? ???????: {selectedLog.action}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <p className="text-slate-400 mb-1 font-sans font-semibold">?????? ??????? (Before):</p>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 overflow-x-auto max-h-60">
                    {JSON.stringify(selectedLog.before_state || {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-emerald-400 mb-1 font-sans font-semibold">?????? ??????? (After):</p>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 overflow-x-auto max-h-60">
                    {JSON.stringify(selectedLog.after_state || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                >
                  ?????
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
`;
fs.writeFileSync('app/(admin)/audit-log/page.tsx', auditContent, 'utf8');

// 3. Health Page
const healthContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Activity,
  RefreshCw
} from 'lucide-react';

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
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
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !health) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400">???? ??? ??? ??????? ?????? ????????...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="???? ?????? ???????? (System Health)"
        subtitle="??? ????? ?????? ???? ??????? ????? ????????? ?????? Webhooks? ???????? ????????"
      />

      <main className="p-8 space-y-6 flex-1">
        <div
          className={\`p-6 rounded-2xl border flex items-center justify-between \${
            health.status === 'healthy'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          }\`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <Activity className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {health.status === 'healthy' ? '???? ????? ?????? ???? ??????' : '???? ??? ????????? ??? ??????? ????????'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">??? ???: {new Date(health.timestamp).toLocaleTimeString('ar-JO')}</p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>????? ????? ????</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-200">???? ????? ????????</h4>
              <StatusBadge status={health.database.status} size="sm" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>??????:</span>
                <span className="text-slate-200">{health.database.driver}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>??? ????????? (Latency):</span>
                <span className="text-emerald-400 font-mono font-bold">{health.database.latencyMs} ms</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-200">??? ??? n8n</h4>
              <StatusBadge status="active" size="sm" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>???? ????????? ????????:</span>
                <span className="text-slate-200">{health.services.n8n.verifiedEndpoints} ??????</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>???? ????????:</span>
                <span className="text-emerald-400 font-semibold">???? ?????????</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-200">????? Meta (WhatsApp/IG/FB)</h4>
              <StatusBadge status={health.services.metaApi.status} size="sm" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>??????? ???????:</span>
                <span className="text-slate-200">
                  {health.services.metaApi.connectedChannels} ?? ??? {health.services.metaApi.totalChannels}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>???? ??????:</span>
                <span className="text-slate-300">?????? ?????? ???????</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
`;
fs.writeFileSync('app/(admin)/health/page.tsx', healthContent, 'utf8');

console.log('Integrations, Audit Log, and Health pages written successfully');
