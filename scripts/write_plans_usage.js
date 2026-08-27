const fs = require('fs');

const plansContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
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

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = isNew ? '/api/admin/plans' : \`/api/admin/plans/\${editingPlan.plan_id}\`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '???? ????? ??? ??????');

      setSuccess(isNew ? '?? ????? ?????? ?????' : '?? ????? ?????? ?????');
      setEditingPlan(null);
      await fetchPlans();
    } catch (err: any) {
      setError(err.message || '??? ??? ????? ?????');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm(\`?? ??? ????? ?? ????? ?? ??? ?????? '\${planId}'?\`)) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(\`/api/admin/plans/\${planId}\`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '??? ??? ??????');

      setSuccess('?? ??? ?????? ?????');
      await fetchPlans();
    } catch (err: any) {
      setError(err.message || '??? ??? ????? ??? ??????');
    }
  };

  const handleDuplicate = (plan: any) => {
    setEditingPlan({
      ...plan,
      plan_id: \`\${plan.plan_id}_copy\`,
      name: \`\${plan.name} (????)\`
    });
    setIsNew(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="????? ??????? ?????? (Plans)"
        subtitle="????? ???? ??????? ???????? ??????? ???????? ??????? ?????? ?????????? ????????"
        actions={
          <button
            onClick={() => {
              setEditingPlan({
                plan_id: '',
                name: '',
                monthly_chat_limit: 1000,
                allowed_channels: ['whatsapp'],
                allowed_message_types: ['text'],
                enabled_modules: ['ai', 'leads'],
                lead_fields: ['name', 'phone', 'service'],
                ai_level: 'Basic',
                memory_level: 'Window',
                order_capture: true,
                human_handoff: true,
                storage_level: 'postgres',
                crm_enabled: true,
                is_active: true
              });
              setIsNew(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>????? ???? ?????</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/50 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.plan_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{plan.name}</h3>
                    <span className="font-mono text-[11px] text-slate-400">ID: {plan.plan_id}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    {plan.is_active !== false ? '????' : '??? ????'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {plan.monthly_chat_limit.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">????? ?????? ??????</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>????? ?????? ?????????:</span>
                    <span className="text-slate-200 font-semibold">{plan.ai_level}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>????? ???????:</span>
                    <span className="text-slate-200 font-semibold">{plan.memory_level}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>?????? ????????:</span>
                    <span className={plan.order_capture ? 'text-emerald-400' : 'text-slate-500'}>
                      {plan.order_capture ? '????' : '??? ????'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>????? ??????:</span>
                    <span className={plan.human_handoff ? 'text-emerald-400' : 'text-slate-500'}>
                      {plan.human_handoff ? '????' : '??? ????'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
                <button
                  onClick={() => handleDuplicate(plan)}
                  title="??? ??????"
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <Copy className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsNew(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>?????</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.plan_id)}
                    title="??? ??????"
                    className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editingPlan && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-sm text-slate-100">
                {isNew ? '????? ???? ?????? ?????' : \`????? ??????: \${editingPlan.name}\`}
              </h3>
              <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">???? ?????? (Plan ID)</label>
                    <input
                      type="text"
                      disabled={!isNew}
                      value={editingPlan.plan_id}
                      onChange={(e) => setEditingPlan({ ...editingPlan, plan_id: e.target.value })}
                      required
                      placeholder="e.g. starter"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">??? ??????</label>
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">???? ?????? ???????</label>
                    <input
                      type="number"
                      value={editingPlan.monthly_chat_limit}
                      onChange={(e) => setEditingPlan({ ...editingPlan, monthly_chat_limit: Number(e.target.value) })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">????? ?????? ?????????</label>
                    <select
                      value={editingPlan.ai_level}
                      onChange={(e) => setEditingPlan({ ...editingPlan, ai_level: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    >
                      <option value="Basic">Basic (????)</option>
                      <option value="Advanced">Advanced (?????)</option>
                      <option value="Custom">Custom (????)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block font-semibold text-slate-400">?????? ???????:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.order_capture}
                        onChange={(e) => setEditingPlan({ ...editingPlan, order_capture: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>????? ?????? ?????? ????????</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.human_handoff}
                        onChange={(e) => setEditingPlan({ ...editingPlan, human_handoff: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>????? ??????? ?????? ??????</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    ?????
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>??? ??????</span>
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
`;
fs.writeFileSync('app/(admin)/plans/page.tsx', plansContent, 'utf8');

const usageContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { MetricCard } from '@/components/layout/MetricCard';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function UsagePage() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/admin/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  if (loading || !usage) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400">???? ????? ?????? ?????????...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="?????? ????????? ????????? (Usage & Quotas)"
        subtitle="????? ????? ??????? ????????? ??????? ?????? ???? ???????? ?????????? ???????"
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="?????? ??????? ????????? ??? ?????"
            value={usage.totalMonthlyMessages.toLocaleString()}
            subtitle="????? ?? ????? ??????? ??????"
            icon={BarChart3}
            color="emerald"
          />
          <MetricCard
            title="??????? ?????????? ?? ???????? ?? ????"
            value={usage.clientsNearLimit?.length || 0}
            subtitle="????? ???????? 80% ????? ?? ??????"
            icon={AlertTriangle}
            color="amber"
          />
          <MetricCard
            title="???? ??????? ?????????"
            value={usage.highestUsageClients?.[0]?.businessName || '—'}
            subtitle={\`\${usage.highestUsageClients?.[0]?.used.toLocaleString() || 0} ?????\`}
            icon={TrendingUp}
            color="cyan"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-200">???? ??????? ??????? ????? ??????</h3>
            <button onClick={fetchUsage} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>?????</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">?????? / ??????</th>
                  <th className="p-4">??????</th>
                  <th className="p-4">????????</th>
                  <th className="p-4">???? ??????</th>
                  <th className="p-4">???????</th>
                  <th className="p-4">???? ?????????</th>
                  <th className="p-4">??????</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(usage.usageByClient || []).map((c: any) => {
                  const remaining = Math.max(0, c.limit - c.used);
                  const isOver = c.percentage >= 100;
                  const isNear = c.percentage >= 80;

                  return (
                    <tr key={c.clientId} className="hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-slate-100">{c.businessName}</td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">{c.clientId}</td>
                      <td className="p-4 font-bold text-emerald-400">{c.used.toLocaleString()}</td>
                      <td className="p-4 text-slate-300">{c.limit.toLocaleString()}</td>
                      <td className="p-4 text-slate-400">{remaining.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="w-32 bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div
                            className={\`h-full rounded-full \${
                              isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                            }\`}
                            style={{ width: \`\${Math.min(100, c.percentage)}%\` }}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={\`font-bold \${isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-slate-300'}\`}>
                          {c.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
`;
fs.writeFileSync('app/(admin)/usage/page.tsx', usageContent, 'utf8');

console.log('Plans and Usage written');
