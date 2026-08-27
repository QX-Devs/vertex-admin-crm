'use client';

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
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
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
    timezone: 'UTC',
    language: 'en',
    plan_id: 'starter',
    service_description: '',
    pricing_rules: '',
    coverage_rules: '',
    booking_requirements: '',
    fallback_response: '',
  });

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      if (!res.ok) throw new Error('Client not found');
      const data = await res.json();
      setClient(data);
      setFormData({
        business_name: data.business_name || '',
        status: data.status || 'active',
        owner_phone: data.owner_phone || '',
        owner_email: data.owner_email || '',
        reply_tone: data.reply_tone || '',
        service_type: data.service_type || '',
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
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

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchPlans();
    }
  }, [clientId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
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
          <p className="text-xs text-slate-400">Loading client profile...</p>
        </div>
      </div>
    );
  }

  const currentPlan = client.plan || plans.find(p => p.plan_id === client.plan_id) || {};

  const TABS = [
    { id: 'general', label: 'General & Subscription' },
    { id: 'service', label: 'AI & Knowledge Base' },
    { id: 'channels', label: 'Channel Integrations' },
    { id: 'usage', label: 'Usage History' },
    { id: 'conversations', label: `Conversations (${client.conversations?.length || 0})` },
    { id: 'leads', label: `Leads & Orders (${client.leads?.length || 0})` },
    { id: 'audit', label: `Audit Trail (${client.auditEvents?.length || 0})` },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title={client.business_name}
        subtitle={`Client ID: ${client.client_id} • Registered: ${new Date(client.created_at).toLocaleDateString('en-US')}`}
        actions={
          <Link
            href="/clients"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Clients</span>
          </Link>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Changes successfully saved and updated across the platform.</span>
          </div>
        )}

        {/* TAB 1: General & Subscription */}
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* General Information Card */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">Tenant Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Account Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending_setup">Pending Setup</option>
                      <option value="configuration_error">Config Error</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Owner Phone</label>
                    <input
                      type="text"
                      value={formData.owner_phone}
                      onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Owner Email</label>
                    <input
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Service Type / Industry</label>
                    <input
                      type="text"
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Subscription Plan</label>
                    <select
                      value={formData.plan_id}
                      onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                      className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                    >
                      {plans.map(p => (
                        <option key={p.plan_id} value={p.plan_id}>
                          {p.name} ({p.monthly_chat_limit.toLocaleString()} chats/mo)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Plan & Quota Summary Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">Plan & Quota Summary</h4>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Current Plan:</span>
                      <span className="font-bold text-emerald-400">{currentPlan.name || client.plan_id}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly Limit:</span>
                      <span className="font-semibold text-slate-200">{client.monthly_limit?.toLocaleString() || 1000} chats</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Used This Month:</span>
                      <span className="font-bold text-cyan-400">{client.used_chats?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Remaining:</span>
                      <span className="font-semibold text-slate-300">
                        {Math.max(0, (client.monthly_limit || 1000) - (client.used_chats || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          (client.usage_percentage || 0) >= 90
                            ? 'bg-rose-500'
                            : (client.usage_percentage || 0) >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, client.usage_percentage || 0)}%` }}
                      />
                    </div>
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between text-slate-400">
                        <span>AI Engine Level:</span>
                        <span className="font-semibold text-slate-200">{currentPlan.ai_level || 'Advanced'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Memory Context:</span>
                        <span className="font-semibold text-slate-200">{currentPlan.memory_level || 'Window'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Order Capture:</span>
                        <span className={currentPlan.order_capture ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                          {currentPlan.order_capture ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Service Configuration */}
        {activeTab === 'service' && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">AI Prompts & Business Rules</h4>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Service & Business Description</label>
                  <textarea
                    rows={3}
                    value={formData.service_description}
                    onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Pricing Rules & Guidelines</label>
                  <textarea
                    rows={2}
                    value={formData.pricing_rules}
                    onChange={(e) => setFormData({ ...formData, pricing_rules: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Coverage Area & Operating Hours</label>
                  <textarea
                    rows={2}
                    value={formData.coverage_rules}
                    onChange={(e) => setFormData({ ...formData, coverage_rules: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Booking Requirements & Lead Fields</label>
                  <textarea
                    rows={2}
                    value={formData.booking_requirements}
                    onChange={(e) => setFormData({ ...formData, booking_requirements: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Fallback Response</label>
                  <textarea
                    rows={2}
                    value={formData.fallback_response}
                    onChange={(e) => setFormData({ ...formData, fallback_response: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 leading-relaxed"
                  />
                </div>
              </div>

              {/* Knowledge Base Section */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    <span>Client Knowledge Base Sections</span>
                  </h4>
                  <span className="text-xs text-slate-400">{client.knowledgeBase?.length || 0} active sections</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(client.knowledgeBase || []).map((kb: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-400">{kb.section_key}</span>
                        <StatusBadge status={kb.enabled ? 'active' : 'paused'} size="sm" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{kb.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save AI Configuration'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Channels (Strictly NO Secrets) */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-300">
                Strict Security Protocol: This screen only displays account IDs, connectivity status, and webhook verification. Secrets and access tokens remain encrypted and inaccessible in the UI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: 'whatsapp', label: 'WhatsApp Cloud API' },
                { key: 'messenger', label: 'Facebook Messenger' },
                { key: 'instagram', label: 'Instagram Direct' }
              ].map((platform) => {
                const integration = (client.integrations || []).find((i: any) => i.platform === platform.key);
                return (
                  <div key={platform.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h4 className="text-xs font-bold text-slate-200">{platform.label}</h4>
                      <StatusBadge status={integration ? integration.status : 'NOT_CONNECTED'} />
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>External Account:</span>
                        <span className="text-slate-200 font-medium">{integration?.external_account_name || '—'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Account ID:</span>
                        <span className="text-slate-200 font-mono">{integration?.external_account_id || client.channel_account_id}</span>
                      </div>
                      {integration?.facebook_page_id && (
                        <div className="flex justify-between text-slate-400">
                          <span>Page ID:</span>
                          <span className="text-slate-200 font-mono">{integration.facebook_page_id}</span>
                        </div>
                      )}
                      {integration?.whatsapp_phone_number_id && (
                        <div className="flex justify-between text-slate-400">
                          <span>Phone Number ID:</span>
                          <span className="text-slate-200 font-mono">{integration.whatsapp_phone_number_id}</span>
                        </div>
                      )}
                      {integration?.waba_id && (
                        <div className="flex justify-between text-slate-400">
                          <span>WABA ID:</span>
                          <span className="text-slate-200 font-mono">{integration.waba_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Webhook Status:</span>
                        <span className="text-emerald-400 font-semibold">{integration?.webhook_status || 'Unconfigured'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Last Verified:</span>
                        <span className="text-slate-300">
                          {integration?.last_validated_at
                            ? new Date(integration.last_validated_at).toLocaleString('en-US')
                            : '—'}
                        </span>
                      </div>
                      {integration?.last_error && (
                        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px]">
                          {integration.last_error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Usage History */}
        {activeTab === 'usage' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-200 mb-4">Monthly Usage Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">Used Messages</th>
                    <th className="p-3">Plan Limit</th>
                    <th className="p-3">Remaining</th>
                    <th className="p-3">Usage %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(client.usageHistory || []).map((u: any, idx: number) => {
                    const pct = Math.min(100, Math.round((u.used_chats / Math.max(u.monthly_limit, 1)) * 100));
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-3 font-medium text-slate-200">{u.month}</td>
                        <td className="p-3 font-bold text-emerald-400">{u.used_chats.toLocaleString()}</td>
                        <td className="p-3 text-slate-400">{u.monthly_limit.toLocaleString()}</td>
                        <td className="p-3 text-slate-400">{Math.max(0, u.monthly_limit - u.used_chats).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`font-semibold ${pct >= 90 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Conversations */}
        {activeTab === 'conversations' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-200 mb-4">Recent Client Conversations ({client.conversations?.length || 0})</h4>
            <div className="space-y-4">
              {(client.conversations || []).map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800/60">
                    <span className="font-semibold text-slate-200">Customer: {c.customer_id} ({c.channel || 'whatsapp'})</span>
                    <span>{new Date(c.created_at).toLocaleString('en-US')}</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                    <span className="text-[10px] text-slate-500 block mb-1">Inbound Customer Message:</span>
                    {c.message_text}
                  </div>
                  {c.public_customer_reply && (
                    <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/30 text-emerald-200 leading-relaxed">
                      <span className="text-[10px] text-emerald-400 block mb-1">AI Assistant Outbound Reply:</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-200 mb-4">Captured Leads & Orders ({client.leads?.length || 0})</h4>
            <div className="space-y-3">
              {(client.leads || []).map((l: any) => (
                <div key={l.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{l.order_payload?.customer_name || l.customer_id}</span>
                      <StatusBadge status={l.lead_status} size="sm" />
                      {l.order_confirmed && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                          Confirmed Booking
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{l.order_payload?.service || l.message_text}</p>
                    {l.notes && <p className="text-[10px] text-amber-400/90 mt-1">Notes: {l.notes}</p>}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(l.created_at).toLocaleDateString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: Audit */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-200 mb-4">Audit Trail for this Tenant</h4>
            <div className="space-y-3">
              {(client.auditEvents || []).map((a: any) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{a.action}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Performed by: {a.admin_email}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(a.created_at).toLocaleString('en-US')}
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
