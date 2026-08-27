'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Headphones,
  Zap,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000); // 12-second live polling
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type?: string) => {
    if (type?.includes('handoff')) return <Headphones className="h-4 w-4 text-amber-400" />;
    if (type?.includes('lead')) return <UserCheck className="h-4 w-4 text-emerald-400" />;
    if (type?.includes('error') || type?.includes('blocked')) return <AlertTriangle className="h-4 w-4 text-rose-400" />;
    return <Zap className="h-4 w-4 text-cyan-400" />;
  };

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actions}

        {/* Live Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live</span>
        </div>

        {/* Interactive Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Live Admin Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                {unreadCount > 9 ? '+9' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-100">Live Operational Alerts</h4>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No new notifications at this time
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 flex items-start gap-3 transition-colors ${
                        !n.is_read ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'hover:bg-slate-800/20'
                      }`}
                    >
                      <div className="mt-0.5 p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                        {getEventIcon(n.event_type || n.block_reason)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-slate-200 truncate">
                            {n.business_name || n.client_id || 'System Alert'}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {n.summary || n.event_type}
                        </p>
                        {n.customer_id && (
                          <span className="inline-block mt-1 text-[10px] text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            Customer: {n.customer_id}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
                <Link
                  href="/audit-log"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5"
                >
                  <span>View full audit log</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
