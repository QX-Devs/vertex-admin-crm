'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  AlertCircle,
  Users,
  MessageSquare,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPlans = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/plans'),
        fetch('/api/admin/clients')
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPlans(pData);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setClients(cData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenNew = () => {
    setIsNew(true);
    setEditingPlan({
      plan_id: '',
      name: '',
      monthly_chat_limit: 1000,
      price_monthly_usd: 50,
      ai_level: 'standard',
      memory_level: 'window',
      human_handoff: true,
      order_capture: true,
      custom_prompt: false,
      analytics_access: false,
      crm_available: true
    });
    setError('');
  };

  const handleOpenEdit = (plan: any) => {
    setIsNew(false);
    setEditingPlan({ ...plan });
    setError('');
  };

  const handleDuplicate = (plan: any) => {
    setIsNew(true);
    setEditingPlan({
      ...plan,
      plan_id: `${plan.plan_id}_copy_${Date.now().toString().slice(-4)}`,
      name: `${plan.name} (Copy)`
    });
    setError('');
  };

  const handleDelete = async (planId: string) => {
    const activeCount = clients.filter(c => c.plan_id === planId && c.status === 'active').length;
    if (activeCount > 0) {
      alert(`Cannot delete this plan because ${activeCount} active tenant(s) are currently subscribed to it.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete plan '${planId}'?`)) return;

    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Plan successfully deleted.');
        setTimeout(() => setSuccess(''), 3000);
        await fetchPlans();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete plan');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/plans', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editingPlan, isNew })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save plan');
      }

      setEditingPlan(null);
      setSuccess('Plan configuration saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
      await fetchPlans();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving plan');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Subscription Plans & Tiers"
        subtitle="Manage monthly chat quotas, pricing tiers, AI capabilities, and feature flags per plan"
        actions={
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-md shadow-emerald-900/30"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Plan</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const assignedClients = clients.filter(c => c.plan_id === plan.plan_id);
            const activeClientsCount = assignedClients.filter(c => c.status === 'active').length;

            return (
              <div
                key={plan.plan_id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-100">{plan.name}</h4>
                      <p className="font-mono text-xs text-slate-400 mt-0.5">{plan.plan_id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400">${plan.price_monthly_usd || 0}</span>
                      <span className="text-[11px] text-slate-400 block">/ month</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Monthly Quota:</span>
                    <span className="font-bold text-slate-100">{plan.monthly_chat_limit.toLocaleString()} chats</span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">AI Intelligence:</span>
                      <span className="font-semibold capitalize text-emerald-400">{plan.ai_level || 'standard'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Context Memory:</span>
                      <span className="font-semibold capitalize text-slate-200">{plan.memory_level || 'window'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Human Handoff:</span>
                      <span className={plan.human_handoff ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {plan.human_handoff ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Order Capture:</span>
                      <span className={plan.order_capture ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {plan.order_capture ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Custom Prompts:</span>
                      <span className={plan.custom_prompt ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {plan.custom_prompt ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>{assignedClients.length} tenants ({activeClientsCount} active)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDuplicate(plan)}
                      title="Duplicate Plan"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      title="Edit Plan"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.plan_id)}
                      disabled={activeClientsCount > 0}
                      title={activeClientsCount > 0 ? 'Cannot delete plan with active subscribers' : 'Delete Plan'}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/60 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Create / Edit Plan */}
        {editingPlan && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-100">
                  {isNew ? 'Create New Subscription Plan' : `Edit Plan: ${editingPlan.name}`}
                </h3>
                <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/50 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Plan Name *</label>
                    <input
                      type="text"
                      required
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      placeholder="e.g. Enterprise Plus"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Plan ID (Slug) *</label>
                    <input
                      type="text"
                      required
                      disabled={!isNew}
                      value={editingPlan.plan_id}
                      onChange={(e) => setEditingPlan({ ...editingPlan, plan_id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="e.g. enterprise_plus"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Monthly Chat Limit *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={editingPlan.monthly_chat_limit}
                      onChange={(e) => setEditingPlan({ ...editingPlan, monthly_chat_limit: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Monthly Price (USD) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingPlan.price_monthly_usd}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly_usd: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">AI Intelligence Level</label>
                    <select
                      value={editingPlan.ai_level}
                      onChange={(e) => setEditingPlan({ ...editingPlan, ai_level: e.target.value })}
                      className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="basic">Basic (Standard fast response)</option>
                      <option value="standard">Standard (Smart conversational)</option>
                      <option value="advanced">Advanced (Multi-turn reasoning & GPT-4o)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Context Memory Mode</label>
                    <select
                      value={editingPlan.memory_level}
                      onChange={(e) => setEditingPlan({ ...editingPlan, memory_level: e.target.value })}
                      className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="none">None</option>
                      <option value="window">Sliding Window</option>
                      <option value="full">Full Vectorized Memory</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-2">Available Features:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.human_handoff}
                        onChange={(e) => setEditingPlan({ ...editingPlan, human_handoff: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-slate-300">Human Handoff Escalation</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.order_capture}
                        onChange={(e) => setEditingPlan({ ...editingPlan, order_capture: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-slate-300">Structured Order & Booking Capture</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.custom_prompt}
                        onChange={(e) => setEditingPlan({ ...editingPlan, custom_prompt: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-slate-300">Custom Prompts & Rules</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.crm_available}
                        onChange={(e) => setEditingPlan({ ...editingPlan, crm_available: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-slate-300">Built-in CRM & Webhooks</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Plan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
