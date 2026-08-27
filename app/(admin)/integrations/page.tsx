'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Network,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Lock,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import Link from 'next/link';

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

  const waCount = integrations.filter(i => i.platform === 'whatsapp' && i.status === 'CONNECTED').length;
  const fbCount = integrations.filter(i => i.platform === 'messenger' && i.status === 'CONNECTED').length;
  const igCount = integrations.filter(i => i.platform === 'instagram' && i.status === 'CONNECTED').length;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="External Integrations & Webhooks"
        subtitle="Monitor multi-channel messaging endpoints, n8n workflow integration, and database connectors"
        actions={
          <button
            onClick={fetchIntegrations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Test Connections</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Security Alert Header */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Security & Token Encryption Standard</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All access tokens and API credentials are cryptographically hashed and managed server-side without exposure in browser payloads.
            </p>
          </div>
        </div>

        {/* Channels Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-300">WhatsApp Cloud API</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                {waCount} Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Official Meta Cloud API gateway with support for template messaging, quick replies, and inbound webhook reception.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-300">Facebook Messenger</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold">
                {fbCount} Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Direct inbox gateway for verified Facebook Business Pages with instant AI response capability.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-300">Instagram Direct</span>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-950 text-pink-400 border border-pink-800 text-[10px] font-bold">
                {igCount} Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated conversation flow and direct message routing for Instagram Professional & Business profiles.
            </p>
          </div>
        </div>

        {/* Active Integrations Registry */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-200">Active Integrations Registry</h4>
            <span className="text-[11px] text-slate-400">Total Entries: {integrations.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Tenant / Client ID</th>
                  <th className="p-4">Platform</th>
                  <th className="p-4">External Account ID</th>
                  <th className="p-4">Connection Status</th>
                  <th className="p-4">Webhook Status</th>
                  <th className="p-4">Last Health Check</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span>Verifying external integration gateways...</span>
                      </div>
                    </td>
                  </tr>
                ) : integrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No active channel integrations found.
                    </td>
                  </tr>
                ) : (
                  integrations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono font-medium text-slate-200">
                        {item.client_id}
                      </td>
                      <td className="p-4">
                        <span className="capitalize font-semibold text-slate-300">
                          {item.platform === 'whatsapp' ? 'WhatsApp' : item.platform === 'messenger' ? 'Messenger' : 'Instagram'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {item.external_account_id}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-400 font-semibold text-[11px]">
                          {item.webhook_status || 'Verified'}
                        </span>
                      </td>
                      <td className="p-4 text-[11px] text-slate-400">
                        {item.last_validated_at ? new Date(item.last_validated_at).toLocaleString('en-US') : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/clients/${item.client_id}`}
                          className="text-emerald-400 hover:text-emerald-300 font-medium text-xs"
                        >
                          View Tenant
                        </Link>
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
