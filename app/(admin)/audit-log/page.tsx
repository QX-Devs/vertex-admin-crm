'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Clock,
  User,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/audit-log');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchSearch =
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.admin_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_id?.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'all' || l.entity === entityFilter;
    return matchSearch && matchEntity;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginated = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Security & Operations Audit Log"
        subtitle="Immutable chronological audit trail of all sensitive admin actions, configuration modifications, and authentication events"
        actions={
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Logs</span>
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
              placeholder="Search by action, admin email, entity ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Entities</option>
              <option value="client">Clients / Tenants</option>
              <option value="lead">Leads & Orders</option>
              <option value="plan">Subscription Plans</option>
              <option value="integration">Channel Integrations</option>
              <option value="auth">Auth & Security</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Entity ID</th>
                  <th className="p-4">Admin Email</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span>Loading audit records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No audit events found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  paginated.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-100">
                        {log.action}
                      </td>
                      <td className="p-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold">
                          {log.entity}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-300">
                        {log.entity_id}
                      </td>
                      <td className="p-4 text-slate-300">
                        {log.admin_email}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="p-4 text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-US')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Diff</span>
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
              Total Events: <span className="font-semibold text-slate-200">{filteredLogs.length}</span> actions
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

        {/* Modal: View Changes Diff */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Action Details: {selectedLog.action}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    User: {selectedLog.admin_email} • {new Date(selectedLog.created_at).toLocaleString('en-US')}
                  </p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-rose-400 block mb-1">State Before (Prior):</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64">
                    {selectedLog.before_state ? JSON.stringify(selectedLog.before_state, null, 2) : '— Initial creation (No prior state)'}
                  </pre>
                </div>

                <div>
                  <span className="font-bold text-emerald-400 block mb-1">State After (Updated):</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64">
                    {selectedLog.after_state ? JSON.stringify(selectedLog.after_state, null, 2) : '— Resource deleted or no updated state'}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
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
