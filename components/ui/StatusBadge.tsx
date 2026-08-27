import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const s = String(status || '').toLowerCase();

  let color = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = status;

  if (s === 'active' || s === 'connected' || s === 'completed' || s === 'converted' || s === 'confirmed' || s === 'healthy') {
    color = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50';
    label = s === 'active' ? 'Active'
      : s === 'connected' ? 'Connected'
      : s === 'confirmed' ? 'Confirmed'
      : s === 'converted' ? 'Converted'
      : s === 'healthy' ? 'Healthy'
      : s === 'completed' ? 'Completed'
      : 'Active';
  } else if (s === 'paused' || s === 'pending' || s === 'waiting' || s === 'contacted' || s === 'validating' || s === 'pending_setup') {
    color = 'bg-amber-950/80 text-amber-300 border-amber-700/50';
    label = s === 'paused' ? 'Paused'
      : s === 'pending' ? 'Pending'
      : s === 'contacted' ? 'Contacted'
      : s === 'validating' ? 'Validating'
      : s === 'pending_setup' ? 'Pending Setup'
      : s === 'waiting' ? 'Waiting'
      : 'Pending';
  } else if (s === 'suspended' || s === 'invalid_credentials' || s === 'expired' || s === 'failed' || s === 'lost' || s === 'cancelled' || s === 'configuration_error') {
    color = 'bg-rose-950/80 text-rose-300 border-rose-700/50';
    label = s === 'suspended' ? 'Suspended'
      : s === 'expired' ? 'Expired'
      : s === 'invalid_credentials' ? 'Invalid Token'
      : s === 'configuration_error' ? 'Config Error'
      : s === 'failed' ? 'Failed'
      : s === 'cancelled' ? 'Cancelled'
      : 'Lost';
  } else if (s === 'new' || s === 'qualified' || s === 'booked' || s === 'in_progress' || s === 'assigned') {
    color = 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50';
    label = s === 'new' ? 'New'
      : s === 'qualified' ? 'Qualified'
      : s === 'booked' ? 'Booked'
      : s === 'assigned' ? 'Assigned'
      : 'In Progress';
  } else if (s === 'not_connected' || s === 'disconnected') {
    color = 'bg-slate-900 text-slate-400 border-slate-800';
    label = 'Disconnected';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${px} ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 inline-block opacity-80" />
      {label}
    </span>
  );
}
