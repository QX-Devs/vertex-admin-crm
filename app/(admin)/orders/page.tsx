'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Phone,
  Clock,
  User,
  MapPin,
  FileText,
  DollarSign,
  CheckCircle2,
  X,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'waiting', label: 'Waiting' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  // Edit Modal
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/leads?confirmedOnly=true');
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

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  const handleOpenEdit = (order: any) => {
    setEditingOrder(order);
    setEditStatus(order.order_status || order.lead_status || 'confirmed');
    setEditNotes(order.notes || '');
    setEditAssignedTo(order.assigned_to || '');
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/leads/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: editStatus,
          lead_status: editStatus,
          notes: editNotes,
          assigned_to: editAssignedTo
        })
      });

      if (res.ok) {
        setEditingOrder(null);
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch =
      (o.customer_id && o.customer_id.includes(search)) ||
      (o.from_phone && o.from_phone.includes(search)) ||
      (o.business_name && o.business_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.order_payload?.customer_name && o.order_payload.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.order_payload?.service && o.order_payload.service.toLowerCase().includes(search.toLowerCase())) ||
      (o.order_payload?.area && o.order_payload.area.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || (o.order_status === statusFilter || o.lead_status === statusFilter);
    const matchClient = clientFilter === 'all' || o.client_id === clientFilter;
    const matchChannel = channelFilter === 'all' || o.channel === channelFilter;

    return matchSearch && matchStatus && matchClient && matchChannel;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginated = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Confirmed Orders & Bookings"
        subtitle="Manage and track customer reservations and service orders automated by AI bots"
        actions={
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Data</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer name, phone, tenant, service, area..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Order Statuses</option>
              {ORDER_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Tenants</option>
              {clients.map(c => (
                <option key={c.client_id} value={c.client_id}>{c.business_name}</option>
              ))}
            </select>

            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="messenger">Messenger</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Customer / Phone</th>
                  <th className="p-4">Tenant</th>
                  <th className="p-4">Requested Service & Area</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Appointment / Time</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Assigned Staff</th>
                  <th className="p-4">Confirmed Date</th>
                  <th className="p-4 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span>Loading bookings & orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      No confirmed orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginated.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100">
                          {order.order_payload?.customer_name || 'Booking Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {order.from_phone || order.customer_id}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/clients/${order.client_id}`}
                          className="font-medium text-slate-200 hover:text-emerald-400 transition-colors"
                        >
                          {order.business_name || order.client_id}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-200 font-medium">{order.order_payload?.service || order.message_text}</div>
                        {order.order_payload?.area && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{order.order_payload.area}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            order.channel === 'whatsapp'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : order.channel === 'messenger'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-pink-950 text-pink-400 border border-pink-800'
                          }`}
                        >
                          {order.channel || 'whatsapp'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-200 font-medium">
                        {order.order_payload?.booking_time || order.order_payload?.preferred_time ? (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Clock className="h-3 w-3" />
                            <span>{order.order_payload.booking_time || order.order_payload.preferred_time}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={order.order_status || order.lead_status || 'confirmed'} />
                      </td>
                      <td className="p-4 text-slate-300 text-xs">
                        {order.assigned_to ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-200">
                            {order.assigned_to}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Total Results: <span className="font-semibold text-slate-200">{filteredOrders.length}</span> confirmed orders
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Edit Confirmed Order */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-100">
                  Update Order: {editingOrder.order_payload?.customer_name || editingOrder.customer_id}
                </h3>
                <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Requested Service:</span>
                    <span className="text-emerald-400 font-semibold">{editingOrder.order_payload?.service}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Area / Address:</span>
                    <span className="text-slate-300">{editingOrder.order_payload?.area || '—'}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Order Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Assigned Fulfillment Staff</label>
                  <input
                    type="text"
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    placeholder="Staff member or technician name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Operational Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add special booking requirements or instructions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-md shadow-emerald-900/30 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Update Order'}</span>
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
