'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  MessageSquare,
  Search,
  Filter,
  UserCheck,
  CalendarCheck,
  Radio,
  Clock,
  Eye,
  X,
  AlertTriangle,
  Bot,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [handoffFilter, setHandoffFilter] = useState(false);
  const [orderFilter, setOrderFilter] = useState(false);
  const [leadFilter, setLeadFilter] = useState(false);

  // Selected for Modal
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
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
    fetchConversations();
    fetchClients();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations.filter(c => {
    const matchSearch =
      (c.message_text && c.message_text.toLowerCase().includes(search.toLowerCase())) ||
      (c.customer_id && c.customer_id.includes(search)) ||
      (c.business_name && c.business_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.public_customer_reply && c.public_customer_reply.toLowerCase().includes(search.toLowerCase()));

    const matchClient = clientFilter === 'all' || c.client_id === clientFilter;
    const matchChannel = channelFilter === 'all' || c.channel === channelFilter;
    const matchHandoff = !handoffFilter || (c.block_reason === 'human_handoff_requested' || c.block_reason?.includes('handoff'));
    const matchOrder = !orderFilter || (c.order_confirmed === true);
    const matchLead = !leadFilter || (c.lead_status && c.lead_status !== 'none');

    return matchSearch && matchClient && matchChannel && matchHandoff && matchOrder && matchLead;
  });

  const totalPages = Math.ceil(filteredConversations.length / pageSize) || 1;
  const paginated = filteredConversations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Central Conversation Log"
        subtitle="Live inspection and audit of all inbound customer queries and AI responses across all tenants"
        actions={
          <button
            onClick={fetchConversations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Feed</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Filters and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search messages, customer ID, tenant name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Client Filter */}
              <select
                value={clientFilter}
                onChange={(e) => {
                  setClientFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="all">All Clients / Tenants</option>
                {clients.map(cl => (
                  <option key={cl.client_id} value={cl.client_id}>{cl.business_name}</option>
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

          {/* Quick Toggle Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 mr-2">Quick Filters:</span>
            <button
              onClick={() => {
                setHandoffFilter(!handoffFilter);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                handoffFilter
                  ? 'bg-amber-950 text-amber-300 border border-amber-700/60 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Human Handoff Requests
            </button>
            <button
              onClick={() => {
                setOrderFilter(!orderFilter);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                orderFilter
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Confirmed Bookings
            </button>
            <button
              onClick={() => {
                setLeadFilter(!leadFilter);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                leadFilter
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Captured Leads
            </button>
          </div>
        </div>

        {/* Conversations Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Tenant / Business</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Message & AI Reply Preview</th>
                  <th className="p-4">Status / Handoff</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span>Loading conversation records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No conversations found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginated.map((conv) => {
                    const isHandoff = conv.block_reason === 'human_handoff_requested' || conv.block_reason?.includes('handoff');
                    return (
                      <tr key={conv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <Link
                            href={`/clients/${conv.client_id}`}
                            className="font-bold text-slate-100 hover:text-emerald-400 text-xs transition-colors"
                          >
                            {conv.business_name || conv.client_id}
                          </Link>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{conv.client_id}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              conv.channel === 'whatsapp'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : conv.channel === 'messenger'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-pink-950 text-pink-400 border border-pink-800'
                            }`}
                          >
                            {conv.channel || 'whatsapp'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-300">
                          {conv.customer_id}
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="text-slate-200 line-clamp-1 text-xs">
                            {conv.message_text}
                          </div>
                          {conv.public_customer_reply && (
                            <div className="text-emerald-400/80 text-[11px] line-clamp-1 mt-0.5">
                              ↳ {conv.public_customer_reply}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1">
                            {isHandoff && (
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50 text-[10px] font-semibold flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Handoff</span>
                              </span>
                            )}
                            {conv.order_confirmed && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-[10px] font-semibold flex items-center gap-1">
                                <CalendarCheck className="h-3 w-3" />
                                <span>Booked</span>
                              </span>
                            )}
                            {!isHandoff && !conv.order_confirmed && (
                              <span className="text-[11px] text-slate-500">Standard</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(conv.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedConv(conv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Total Results: <span className="font-semibold text-slate-200">{filteredConversations.length}</span> conversations
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

        {/* Modal: View Full Conversation Details */}
        {selectedConv && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Conversation with Customer: {selectedConv.customer_id}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tenant: {selectedConv.business_name || selectedConv.client_id} • Channel: {selectedConv.channel}
                  </p>
                </div>
                <button onClick={() => setSelectedConv(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Timeline */}
              <div className="space-y-4 py-2">
                {/* Customer Incoming Bubble */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 rounded-tl-none space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Customer ({selectedConv.customer_id})</span>
                      <span>{new Date(selectedConv.created_at).toLocaleTimeString('en-US')}</span>
                    </div>
                    <p className="text-xs text-slate-100 leading-relaxed">{selectedConv.message_text}</p>
                  </div>
                </div>

                {/* Bot Outgoing Bubble */}
                {selectedConv.public_customer_reply && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-4 rounded-tl-none space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-400/80">
                        <span className="font-semibold text-emerald-300">AI Assistant</span>
                        <span>{new Date(selectedConv.created_at).toLocaleTimeString('en-US')}</span>
                      </div>
                      <p className="text-xs text-emerald-100 leading-relaxed">{selectedConv.public_customer_reply}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Meta information footer */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Message ID:</span>
                  <span className="font-mono text-slate-200">{selectedConv.id}</span>
                </div>
                {selectedConv.block_reason && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Escalation / Block Reason:</span>
                    <span className="text-amber-400 font-semibold">{selectedConv.block_reason}</span>
                  </div>
                )}
                {selectedConv.order_payload && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1">Extracted Structured Payload:</span>
                    <pre className="text-[11px] font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-emerald-300">
                      {JSON.stringify(selectedConv.order_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
