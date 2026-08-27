import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'indigo';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'positive',
  color = 'emerald',
}: MetricCardProps) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/30',
    cyan: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/30',
    amber: 'text-amber-400 bg-amber-950/50 border-amber-800/30',
    rose: 'text-rose-400 bg-rose-950/50 border-rose-800/30',
    indigo: 'text-indigo-400 bg-indigo-950/50 border-indigo-800/30',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trendType === 'positive'
                  ? 'text-emerald-400'
                  : trendType === 'negative'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
