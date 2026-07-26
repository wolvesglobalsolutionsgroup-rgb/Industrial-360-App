import React from 'react';
import { Card } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  change?: number; // delta percentage
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  change,
  changeType = 'neutral',
  loading = false,
  className = ''
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-2.5 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/5"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
          </div>
          {icon && <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>}
        </div>
      </Card>
    );
  }

  const isPositive = changeType === 'positive' || (changeType === 'neutral' && change && change > 0);
  const isNegative = changeType === 'negative' || (changeType === 'neutral' && change && change < 0);

  return (
    <Card hoverEffect className={`flex flex-col justify-between ${className}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1 overflow-hidden">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
            {title}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono block">
            {value}
          </span>
        </div>
        {icon && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-100 dark:border-slate-750 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(description || change !== undefined) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100/80 dark:border-slate-800/80 text-xs font-medium">
          {change !== undefined && (
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
              isPositive 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                : isNegative 
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' 
                  : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {isPositive ? <ArrowUpRight size={12} /> : isNegative ? <ArrowDownRight size={12} /> : null}
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
          {description && (
            <span className="text-slate-500 dark:text-slate-400 truncate">{description}</span>
          )}
        </div>
      )}
    </Card>
  );
}

export default MetricCard;
