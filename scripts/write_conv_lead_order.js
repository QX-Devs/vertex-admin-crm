const fs = require('fs');

// 1. Conversations Page
const convContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  MessageSquare,
  Search,
  User,
  Bot,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState<any>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch(\`/api/admin/conversations?search=\${encodeURIComponent(search)}\`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !selectedConv) {
          setSelectedConv(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [search]);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="??? ????????? ???????"
        subtitle="?????? ???? ????????? ??????? ????????? ?????? ??????? ?????? ?????? ??????"
      />

      <main className="p-8 flex-1 flex flex-col">
        <div className="mb-6 flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="??? ?? ???????? ??? ??????? ?? ??? ??????..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
          </div>
          <button
            onClick={fetchConversations}
            title="?????"
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-300">
              ????????? ??????? ({conversations.length})
            </div>
            <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1 max-h-[600px]">
              {conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={\`w-full text-right p-4 transition-all flex flex-col gap-1.5 \${
                      isSelected ? 'bg-slate-800/80 border-r-2 border-emerald-400' : 'hover:bg-slate-800/30'
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">{c.business_name || c.client_id}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{c.message_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {c.channel || 'whatsapp'}
                      </span>
                      {c.order_confirmed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                          ??? ????
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            {selectedConv ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{selectedConv.business_name}</h3>
                    <p className="text-xs text-slate-400">???? ??????: {selectedConv.customer_id}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedConv.created_at).toLocaleString('ar-JO')}
                  </span>
                </div>

                <div className="space-y-4 py-2">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl rounded-tr-none max-w-md">
                      <p className="text-xs font-semibold text-slate-400 mb-1">?????? ({selectedConv.customer_id})</p>
                      <p className="text-xs text-slate-100 leading-relaxed">{selectedConv.message_text}</p>
                    </div>
                  </div>

                  {selectedConv.public_customer_reply && (
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="h-8 w-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-emerald-950/40 border border-emerald-800/50 p-3.5 rounded-2xl rounded-tl-none max-w-md text-right">
                        <p className="text-xs font-semibold text-emerald-400 mb-1">???? ???? ????? (AI Assistant)</p>
                        <p className="text-xs text-emerald-100 leading-relaxed">{selectedConv.public_customer_reply}</p>
                      </div>
                    </div>
                  )}

                  {selectedConv.block_reason && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>??? ?????? / ???????: {selectedConv.block_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                ???? ?????? ???? ?????? ???? ?????? ???????
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
`;
fs.writeFileSync('app/(admin)/conversations/page.tsx', convContent, 'utf8');

// 2. Leads Page
const leadsContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  UserCheck,
  Search,
  RefreshCw,
  Phone,
  Save
} from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingLead, setEditingLead] = useState<any>(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch(\`/api/admin/leads?search=\${encodeURIComponent(search)}\`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search]);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      const res = await fetch(\`/api/admin/leads/\${editingLead.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_status: editingLead.lead_status,
          assigned_staff: editingLead.assigned_staff,
          notes: editingLead.notes
        })
      });
      if (res.ok) {
        setEditingLead(null);
        await fetchLeads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="????? ??????? ????????? (Leads)"
        subtitle="?????? ???? ??????? ?????????? ????? ????????? ?????? ?????????"
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="??? ???? ??????? ??????? ?? ?????? ????????..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
          </div>
          <button
            onClick={fetchLeads}
            title="?????"
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4">?????? / ???? ?????</th>
                  <th className="p-4">?????? / ??????</th>
                  <th className="p-4">?????? ????????</th>
                  <th className="p-4">?????? / ???????</th>
                  <th className="p-4">???? ?????? ???????</th>
                  <th className="p-4">?????? ???????</th>
                  <th className="p-4">???????</th>
                  <th className="p-4 text-left">?????????</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{lead.order_payload?.customer_name || lead.customer_id}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{lead.from_phone || lead.customer_id}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-300">{lead.business_name}</td>
                    <td className="p-4 text-slate-300">{lead.order_payload?.service || lead.message_text}</td>
                    <td className="p-4 text-slate-400">{lead.order_payload?.area || '—'}</td>
                    <td className="p-4">
                      <StatusBadge status={lead.lead_status} />
                    </td>
                    <td className="p-4 text-slate-300 font-medium">{lead.assigned_staff || '??? ????'}</td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {new Date(lead.created_at).toLocaleDateString('ar-JO')}
                    </td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => setEditingLead(lead)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                      >
                        ????? ???????
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editingLead && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
              <h3 className="font-bold text-sm text-slate-100">????? ?????? ?????? ???????</h3>
              <form onSubmit={handleUpdateLead} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">???? ?????? ???????</label>
                  <select
                    value={editingLead.lead_status}
                    onChange={(e) => setEditingLead({ ...editingLead, lead_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  >
                    <option value="new">???? (New)</option>
                    <option value="contacted">?? ??????? (Contacted)</option>
                    <option value="qualified">???? (Qualified)</option>
                    <option value="booked">?? ????? (Booked)</option>
                    <option value="converted">????? ????? (Converted)</option>
                    <option value="lost">????? (Lost)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">?????? ???????</label>
                  <input
                    type="text"
                    value={editingLead.assigned_staff || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, assigned_staff: e.target.value })}
                    placeholder="??? ?????? ?? ??????"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">????????? ????????</label>
                  <textarea
                    rows={3}
                    value={editingLead.notes || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    ?????
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>???</span>
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
fs.writeFileSync('app/(admin)/leads/page.tsx', leadsContent, 'utf8');

// 3. Orders Page
const ordersContent = `'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CalendarCheck,
  Search,
  RefreshCw,
  Phone,
  Clock,
  Save
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(\`/api/admin/orders?search=\${encodeURIComponent(search)}\`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const res = await fetch(\`/api/admin/orders/\${editingOrder.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: editingOrder.order_status,
          assigned_staff: editingOrder.assigned_staff,
          notes: editingOrder.notes
        })
      });
      if (res.ok) {
        setEditingOrder(null);
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="????? ???????? ???????? ???????"
        subtitle="?????? ???????? ???????? ???????? ??? ?????? ?????"
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="??? ?? ???????? ????????..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
          </div>
          <button
            onClick={fetchOrders}
            title="?????"
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4">?????? / ???? ?????</th>
                  <th className="p-4">??????</th>
                  <th className="p-4">?????? ????????</th>
                  <th className="p-4">???? ????? / ?????</th>
                  <th className="p-4">???? ?????</th>
                  <th className="p-4">?????? ??????</th>
                  <th className="p-4 text-left">?????????</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{order.order_payload?.customer_name || order.customer_id}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{order.from_phone || order.customer_id}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-300">{order.business_name}</td>
                    <td className="p-4 text-slate-300 font-semibold">{order.order_payload?.service || order.message_text}</td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-400" />
                        <span>
                          {order.order_payload?.booking_date || '—'} {order.order_payload?.booking_time || ''}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.order_status || 'confirmed'} />
                    </td>
                    <td className="p-4 text-slate-300">{order.assigned_staff || '??? ????'}</td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => setEditingOrder(order)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                      >
                        ?????? ?????
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editingOrder && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
              <h3 className="font-bold text-sm text-slate-100">?????? ?????? ???? ?????</h3>
              <form onSubmit={handleUpdateOrder} className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>??????:</span>
                    <span className="text-slate-200 font-bold">{editingOrder.order_payload?.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>??????:</span>
                    <span className="text-emerald-400 font-semibold">{editingOrder.order_payload?.service}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>?????? / ?????:</span>
                    <span className="text-slate-300">{editingOrder.order_payload?.area || '—'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">???? ?????</label>
                  <select
                    value={editingOrder.order_status || 'confirmed'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, order_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  >
                    <option value="pending">??? ???????? (Pending)</option>
                    <option value="confirmed">???? (Confirmed)</option>
                    <option value="assigned">?? ??????? ?????? (Assigned)</option>
                    <option value="in_progress">??? ??????? (In Progress)</option>
                    <option value="completed">????? ????? (Completed)</option>
                    <option value="cancelled">???? (Cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">?????? ??????</label>
                  <input
                    type="text"
                    value={editingOrder.assigned_staff || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, assigned_staff: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">??????? ?????</label>
                  <textarea
                    rows={3}
                    value={editingOrder.notes || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    ?????
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>??? ?????????</span>
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
fs.writeFileSync('app/(admin)/orders/page.tsx', ordersContent, 'utf8');

console.log('Conversations, Leads, and Orders pages written successfully');
