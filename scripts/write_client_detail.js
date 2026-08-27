const fs = require('fs');
const path = require('path');

const target = 'app/api/admin/clients/[id]/route.ts'; // ensure dir exists
fs.mkdirSync('app/(admin)/clients/[id]', { recursive: true });

const content = `'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  MessageSquare,
  UserCheck,
  CalendarCheck,
  Settings,
  Layers,
  Radio,
  History,
  Save,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    status: 'active',
    owner_phone: '',
    owner_email: '',
    reply_tone: '',
    service_type: '',
    timezone: 'Asia/Amman',
    language: 'ar-JO',
    plan_id: 'starter',
    service_description: '',
    pricing_rules: '',
    coverage_rules: '',
    booking_requirements: '',
    fallback_response: '',
  });

  const fetchClient = async () => {
    try {
      const res = await fetch(\`/api/admin/clients/\${clientId}\`);
      if (!res.ok) throw new Error('?????? ??? ?????');
      const data = await res.json();
      setClient(data);
      setFormData({
        business_name: data.business_name || '',
        status: data.status || 'active',
        owner_phone: data.owner_phone || '',
        owner_email: data.owner_email || '',
        reply_tone: data.reply_tone || '',
        service_type: data.service_type || '',
        timezone: data.timezone || 'Asia/Amman',
        language: data.language || 'ar-JO',
        plan_id: data.plan_id || 'starter',
        service_description: data.settings?.service_description || '',
        pricing_rules: data.settings?.pricing_rules || '',
        coverage_rules: data.settings?.coverage_rules || '',
        booking_requirements: data.settings?.booking_requirements || '',
        fallback_response: data.settings?.fallback_response || '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchClient();
  }, [clientId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(\`/api/admin/clients/\${clientId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUpdates: {
            business_name: formData.business_name,
            status: formData.status,
            owner_phone: formData.owner_phone,
            owner_email: formData.owner_email,
            reply_tone: formData.reply_tone,
            service_type: formData.service_type,
            timezone: formData.timezone,
            language: formData.language,
            plan_id: formData.plan_id,
          },
          settingsUpdates: {
            service_description: formData.service_description,
            pricing_rules: formData.pricing_rules,
            coverage_rules: formData.coverage_rules,
            booking_requirements: formData.booking_requirements,
            fallback_response: formData.fallback_response,
          }
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await fetchClient();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !client) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400">???? ????? ?????? ??????...</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'general', label: '????????? ?????? ?????????' },
    { id: 'service', label: '??????? ?????? ??????? ?????????' },
    { id: 'channels', label: '??????? ??????????' },
    { id: 'usage', label: '??? ?????????' },
    { id: 'conversations', label: '????????? ???????' },
    { id: 'leads', label: '??????? ????????? ?????????' },
    { id: 'audit', label: '??? ???????? ????????' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title={client.business_name}
        subtitle={\`???? ??????: \${client.client_id} • ????? ???????: \${new Date(client.created_at).toLocaleDateString('ar-JO')}\`}
        actions={
          <Link
            href="/clients"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            <span>?????? ???????</span>
          </Link>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={\`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all \${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }\`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>?? ??? ????????? ????? ?????? ????? ????????.</span>
          </div>
        )}

        {/* TAB 1: General & Subscription */}
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">???????? ????????</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">??? ?????? ???????</label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">???? ??????</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="active">??? (Active)</option>
                    <option value="paused">????? ?????? (Paused)</option>
                    <option value="suspended">????? (Suspended)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">??? ???? ??????</label>
                  <input
                    type="text"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">?????? ??????????</label>
                  <input
                    type="email"
                    value={formData.owner_email}
                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">??? ?????? / ??????</label>
                  <input
                    type="text"
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">???? ????????</label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="starter">Starter Plan (1,000 ?????)</option>
                    <option value="professional">Professional Business (5,000 ?????)</option>
                    <option value="enterprise">Enterprise VIP (25,000 ?????)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? '???? ?????...' : '??? ?????????'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Service Configuration */}
        {activeTab === 'service' && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">??????? ?????? ????? ?????</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">??? ?????? ????????</label>
                  <textarea
                    rows={3}
                    value={formData.service_description}
                    onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">????? ??????? ????????</label>
                  <textarea
                    rows={2}
                    value={formData.pricing_rules}
                    onChange={(e) => setFormData({ ...formData, pricing_rules: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">??????? ??????? ?????</label>
                  <textarea
                    rows={2}
                    value={formData.coverage_rules}
                    onChange={(e) => setFormData({ ...formData, coverage_rules: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">??????? ????? ??????</label>
                  <textarea
                    rows={2}
                    value={formData.booking_requirements}
                    onChange={(e) => setFormData({ ...formData, booking_requirements: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">????? ???? ?????? (Fallback)</label>
                  <textarea
                    rows={2}
                    value={formData.fallback_response}
                    onChange={(e) => setFormData({ ...formData, fallback_response: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? '???? ?????...' : '??? ??????? ??????'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Channels (Strictly NO Secrets) */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-300">
                ????? ??????: ?????? ?????? ????? ??????? ????? ??????? ??? ?????? ??? ???? ????? ??? ???????.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['whatsapp', 'messenger', 'instagram'].map((platform) => {
                const integration = (client.integrations || []).find((i: any) => i.platform === platform);
                return (
                  <div key={platform} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200 capitalize">???? {platform}</h4>
                      <StatusBadge status={integration ? integration.status : 'NOT_CONNECTED'} />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>??? ??????:</span>
                        <span className="text-slate-200 font-medium">{integration?.external_account_name || '—'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>???? ??????:</span>
                        <span className="text-slate-200 font-mono">{integration?.external_account_id || '—'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>???? ??? Webhook:</span>
                        <span className="text-emerald-400">{integration?.webhook_status || '??? ????'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>??? ????:</span>
                        <span className="text-slate-300">
                          {integration?.last_validated_at
                            ? new Date(integration.last_validated_at).toLocaleDateString('ar-JO')
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Usage History */}
        {activeTab === 'usage' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-200 mb-4">??? ????????? ??????</h4>
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">?????</th>
                  <th className="p-3">??????? ?????????</th>
                  <th className="p-3">???? ??????</th>
                  <th className="p-3">???? ?????????</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(client.usageHistory || []).map((u: any, idx: number) => {
                  const pct = Math.min(100, Math.round((u.used_chats / Math.max(u.monthly_limit, 1)) * 100));
                  return (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-200">{u.month}</td>
                      <td className="p-3 font-bold text-emerald-400">{u.used_chats.toLocaleString()}</td>
                      <td className="p-3 text-slate-400">{u.monthly_limit.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={\`font-semibold \${pct >= 90 ? 'text-rose-400' : 'text-slate-300'}\`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: Conversations */}
        {activeTab === 'conversations' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-200 mb-4">??????? ?????? ??????? ({client.conversations?.length || 0})</h4>
            <div className="space-y-3">
              {(client.conversations || []).map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-200">{c.customer_id}</span>
                    <span>{new Date(c.created_at).toLocaleString('ar-JO')}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-slate-300">
                    <span className="text-[10px] text-slate-500 block mb-1">??????:</span>
                    {c.message_text}
                  </div>
                  {c.public_customer_reply && (
                    <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/30 text-emerald-200">
                      <span className="text-[10px] text-emerald-400 block mb-1">???? ????? (???? ???????):</span>
                      {c.public_customer_reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Leads */}
        {activeTab === 'leads' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-200 mb-4">??? ??????? ????????? ???????? ({client.leads?.length || 0})</h4>
            <div className="space-y-3">
              {(client.leads || []).map((l: any) => (
                <div key={l.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{l.order_payload?.customer_name || l.customer_id}</span>
                      <StatusBadge status={l.lead_status} size="sm" />
                      {l.order_confirmed && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                          ??? ????
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{l.order_payload?.service || l.message_text}</p>
                    {l.notes && <p className="text-[10px] text-amber-400/90 mt-1">??????: {l.notes}</p>}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(l.created_at).toLocaleDateString('ar-JO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: Audit */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-200 mb-4">??? ???????? ???????? ?????? ???? ??????</h4>
            <div className="space-y-3">
              {(client.auditEvents || []).map((a: any) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{a.action}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">??????: {a.admin_email}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(a.created_at).toLocaleString('ar-JO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
`;

fs.writeFileSync('app/(admin)/clients/[id]/page.tsx', content, 'utf8');
console.log('Wrote client detail page');
