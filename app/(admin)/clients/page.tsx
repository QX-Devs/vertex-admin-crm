'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Play,
  Pause,
  ShieldX,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  UserCheck,
  CalendarCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    client_id: '',
    business_name: '',
    channel_account_id: '',
    channel: 'whatsapp',
    plan_id: 'starter',
    owner_phone: '',
    owner_email: '',
    reply_tone: 'Professional, friendly, highly accurate',
    service_type: 'Appointments and customer inquiries',
    timezone: 'UTC',
    language: 'en'
  });
  const [creatingClient, setCreatingClient] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
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
    fetchClients();
    fetchPlans();
  }, []);

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    setActionLoading(clientId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUpdates: { status: newStatus }
        })
      });
      if (res.ok) {
        await fetchClients();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
      setActiveMenuId(null);
    }
  };

  const handleResetConfig = async (clientId: string) => {
    if (!confirm(`Are you sure you want to reset settings for client '${clientId}' to default?`)) return;
    setActionLoading(clientId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingsUpdates: {
            service_description: 'Core client services and offering',
            pricing_rules: 'Standard official pricing guidelines',
            coverage_rules: 'Operating hours: Monday to Friday 9:00 AM - 6:00 PM',
            booking_requirements: 'Customer name, phone number, and service selection',
            fallback_response: 'Hello! Your inquiry has been forwarded to our team and we will reach out shortly.'
          }
        })
      });
      if (res.ok) {
        alert('Client settings successfully reset to defaults.');
        await fetchClients();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
      setActiveMenuId(null);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);
    setModalError('');

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      setShowAddModal(false);
      setNewClient({
        client_id: '',
        business_name: '',
        channel_account_id: '',
        channel: 'whatsapp',
        plan_id: 'starter',
        owner_phone: '',
        owner_email: '',
        reply_tone: 'Professional, friendly, highly accurate',
        service_type: 'Appointments and customer inquiries',
        timezone: 'UTC',
        language: 'en'
      });
      await fetchClients();
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while creating client');
    } finally {
      setCreatingClient(false);
    }
  };

  // Filter & Sort
  const filteredClients = clients
    .filter(c => {
      const matchSearch =
        c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.client_id?.toLowerCase().includes(search.toLowerCase()) ||
        c.owner_phone?.includes(search) ||
        c.owner_email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchPlan = planFilter === 'all' || c.plan_id === planFilter;
      const matchChannel = channelFilter === 'all' || c.channel === channelFilter;
      return matchSearch && matchStatus && matchPlan && matchChannel;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return (a.business_name || '').localeCompare(b.business_name || '');
      if (sortBy === 'name_desc') return (b.business_name || '').localeCompare(a.business_name || '');
      if (sortBy === 'usage_desc') return (b.used_chats || 0) - (a.used_chats || 0);
      if (sortBy === 'leads_desc') return (b.leads_count || 0) - (a.leads_count || 0);
      if (sortBy === 'orders_desc') return (b.orders_count || 0) - (a.orders_count || 0);
      if (sortBy === 'created_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Client & Tenant Management"
        subtitle="Manage subscribed business accounts, monitor quotas, and configure channel routing"
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-md shadow-emerald-900/30"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Client</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 w-full lg:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by business name, Client ID, phone, email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
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
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="suspended">Suspended</option>
              <option value="pending_setup">Pending Setup</option>
              <option value="configuration_error">Config Error</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Plans</option>
              {plans.map(p => (
                <option key={p.plan_id} value={p.plan_id}>{p.name}</option>
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

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name (A - Z)</option>
              <option value="usage_desc">Highest Usage</option>
              <option value="leads_desc">Most Leads</option>
              <option value="orders_desc">Most Orders</option>
            </select>

            <button
              onClick={fetchClients}
              title="Refresh Data"
              className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Business / Tenant</th>
                  <th className="p-4">Client ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Channels</th>
                  <th className="p-4">Monthly Usage</th>
                  <th className="p-4">Leads & Orders</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span>Loading client records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      No clients found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client) => (
                    <tr key={client.client_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100 text-xs">{client.business_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{client.owner_phone || client.owner_email || '—'}</div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-300">
                        {client.client_id}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-200">{client.plan_name || client.plan_id}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            title="WhatsApp"
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              client.whatsapp_status === 'CONNECTED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }`}
                          >
                            WA
                          </span>
                          <span
                            title="Facebook Messenger"
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              client.facebook_status === 'CONNECTED'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }`}
                          >
                            FB
                          </span>
                          <span
                            title="Instagram"
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              client.instagram_status === 'CONNECTED'
                                ? 'bg-pink-950 text-pink-400 border border-pink-800'
                                : client.instagram_status === 'EXPIRED'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }`}
                          >
                            IG
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{client.used_chats || 0}</span>
                            <span>{client.monthly_limit || 1000}</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
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
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        <div className="space-y-0.5">
                          <div>
                            <span className="font-semibold text-cyan-400">{client.leads_count || 0}</span> leads •{' '}
                            <span className="font-semibold text-emerald-400">{client.orders_count || 0}</span> orders
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {client.conversations_count || 0} conversations
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {client.last_activity ? new Date(client.last_activity).toLocaleDateString('en-US') : '—'}
                      </td>
                      <td className="p-4 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Active / Pause */}
                          {client.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(client.client_id, 'paused')}
                              disabled={actionLoading === client.client_id}
                              title="Pause Account"
                              className="p-1.5 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:bg-amber-900/60 transition-colors"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(client.client_id, 'active')}
                              disabled={actionLoading === client.client_id}
                              title="Activate Account"
                              className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60 transition-colors"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Open Details */}
                          <Link
                            href={`/clients/${client.client_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                          >
                            <span>Details</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>

                          {/* Context Menu Trigger */}
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === client.client_id ? null : client.client_id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === client.client_id && (
                            <div className="absolute right-4 top-12 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1.5 text-xs text-left">
                              <Link
                                href={`/conversations?clientId=${client.client_id}`}
                                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800"
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                                <span>View Conversations</span>
                              </Link>
                              <Link
                                href={`/leads?clientId=${client.client_id}`}
                                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800"
                              >
                                <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                                <span>View Leads</span>
                              </Link>
                              <Link
                                href={`/orders?clientId=${client.client_id}`}
                                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800"
                              >
                                <CalendarCheck className="h-3.5 w-3.5 text-emerald-400" />
                                <span>View Orders & Bookings</span>
                              </Link>
                              <div className="h-px bg-slate-800 my-1" />
                              <button
                                onClick={() => handleStatusChange(client.client_id, 'suspended')}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-slate-800"
                              >
                                <ShieldX className="h-3.5 w-3.5" />
                                <span>Suspend Account</span>
                              </button>
                              <button
                                onClick={() => handleResetConfig(client.client_id)}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 text-amber-400 hover:bg-slate-800"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Reset Configuration</span>
                              </button>
                            </div>
                          )}
                        </div>
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
              Total Results: <span className="font-semibold text-slate-200">{filteredClients.length}</span> clients
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

        {/* Modal: Add New Client */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-100">Add New Business Tenant</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/50 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={newClient.business_name}
                      onChange={(e) => setNewClient({ ...newClient, business_name: e.target.value })}
                      placeholder="e.g. Apex Health Center"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Client ID (Unique Slug) *</label>
                    <input
                      type="text"
                      required
                      value={newClient.client_id}
                      onChange={(e) => setNewClient({ ...newClient, client_id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="e.g. client_apex"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Channel Account ID (Phone / Page ID) *</label>
                    <input
                      type="text"
                      required
                      value={newClient.channel_account_id}
                      onChange={(e) => setNewClient({ ...newClient, channel_account_id: e.target.value })}
                      placeholder="e.g. 1098800089990625"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Primary Channel</label>
                    <select
                      value={newClient.channel}
                      onChange={(e) => setNewClient({ ...newClient, channel: e.target.value })}
                      className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="messenger">Facebook Messenger</option>
                      <option value="instagram">Instagram Direct</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Subscription Plan</label>
                    <select
                      value={newClient.plan_id}
                      onChange={(e) => setNewClient({ ...newClient, plan_id: e.target.value })}
                      className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                    >
                      {plans.map(p => (
                        <option key={p.plan_id} value={p.plan_id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Owner / Contact Phone</label>
                    <input
                      type="text"
                      value={newClient.owner_phone}
                      onChange={(e) => setNewClient({ ...newClient, owner_phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Owner Email</label>
                    <input
                      type="email"
                      value={newClient.owner_email}
                      onChange={(e) => setNewClient({ ...newClient, owner_email: e.target.value })}
                      placeholder="owner@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Industry / Service Type</label>
                    <input
                      type="text"
                      value={newClient.service_type}
                      onChange={(e) => setNewClient({ ...newClient, service_type: e.target.value })}
                      placeholder="Medical, Restaurant, Real Estate..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-md shadow-emerald-900/30 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{creatingClient ? 'Saving...' : 'Create Client'}</span>
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
