'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Phone,
  MessageSquare,
  CalendarCheck,
  CheckCircle2,
  X,
  Save,
  Clock,
  User,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'validating', label: 'Validating' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'booked', label: 'Booked' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'lost', label: 'Lost' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  // Edit Modal
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editConfirmed, setEditConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/admin/leads');
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
    fetchLeads();
    fetchClients();
    const interval = setInterval(fetchLeads, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenEdit = (lead: any) => {
    setEditingLead(lead);
    setEditStatus(lead.lead_status || 'new');
    setEditNotes(lead.notes || '');
    setEditAssignedTo(lead.assigned_to || '');
    setEditConfirmed(Boolean(lead.order_confirmed));
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_status: editStatus,
          notes: editNotes,
          assigned_to: editAssignedTo,
          order_confirmed: editConfirmed
        })
      });

      if (res.ok) {
        setEditingLead(null);
        await fetchLeads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchSearch =
      (l.customer_id && l.customer_id.includes(search)) ||
      (l.from_phone && l.from_phone.includes(search)) ||
      (l.business_name && l.business_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.order_payload?.customer_name && l.order_payload.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.order_payload?.service && l.order_payload.service.toLowerCase().includes(search.toLowerCase())) ||
      (l.order_payload?.area && l.order_payload.area.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || l.lead_status === statusFilter;
    const matchClient = clientFilter === 'all' || l.client_id === clientFilter;
    const matchChannel = channelFilter === 'all' || l.channel === channelFilter;

    return matchSearch && matchStatus && matchClient && matchChannel;
  });

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginated = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Leads Pipeline Management"
        subtitle="Track inbound sales inquiries, status conversions, and staff assignments across all tenants"
        actions={
          <button
            onClick={fetchLeads}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Data</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, phone, tenant, service, area..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {LEAD_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Client Filter */}
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

            {/* Channel Filter */}
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

        {/* Leads Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Customer / Phone</th>
                  <th className="p-4">Tenant</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Requested Service & Area</th>
                  <th className="p-4">Lead Status</th>
                  <th className="p-4">Booking Status</th>
                  <th className="p-4">Assigned Staff</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span>Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      No leads found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginated.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100">
                          {lead.order_payload?.customer_name || 'Anonymous Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {lead.from_phone || lead.customer_id}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/clients/${lead.client_id}`}
                          className="font-medium text-slate-200 hover:text-emerald-400 transition-colors"
                        >
                          {lead.business_name || lead.client_id}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            lead.channel === 'whatsapp'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : lead.channel === 'messenger'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-pink-950 text-pink-400 border border-pink-800'
                          }`}
                        >
                          {lead.channel || 'whatsapp'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-200 font-medium">{lead.order_payload?.service || lead.message_text}</div>
                        {lead.order_payload?.area && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{lead.order_payload.area}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={lead.lead_status} />
                      </td>
                      <td className="p-4">
                        {lead.order_confirmed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Confirmed</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unconfirmed</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300 text-xs">
                        {lead.assigned_to ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-200">
                            {lead.assigned_to}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(lead)}
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

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Total Results: <span className="font-semibold text-slate-200">{filteredLeads.length}</span> leads
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

        {/* Modal: Edit Lead */}
        {editingLead && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-100">
                  Update Lead: {editingLead.order_payload?.customer_name || editingLead.customer_id}
                </h3>
                <button onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Lead Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                  >
                    {LEAD_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Assigned Staff</label>
                  <input
                    type="text"
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    placeholder="Staff member name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="confirmedCheck"
                    checked={editConfirmed}
                    onChange={(e) => setEditConfirmed(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <label htmlFor="confirmedCheck" className="text-slate-200 font-medium cursor-pointer">
                    Confirm Final Booking (Convert to Confirmed Order)
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Internal Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes on customer interaction..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
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
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
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
