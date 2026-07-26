import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  accentColor?: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'slate' | 'error' | 'brand';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  sublabel,
  trend,
  icon,
  accentColor = 'brand',
  className = '',
}) => {
  const accentBorders = {
    brand: 'before:bg-brand-500',
    emerald: 'before:bg-emerald-500',
    cyan: 'before:bg-cyan-500',
    amber: 'before:bg-amber-500',
    indigo: 'before:bg-indigo-500',
    slate: 'before:bg-slate-500',
    error: 'before:bg-rose-500',
  };

  const iconStyles = {
    brand: 'bg-brand-500/10 text-brand-500 border border-brand-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/60',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    error: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
  };

  return (
    <div
      className={`relative overflow-hidden bg-surface border border-line rounded-2xl p-5 shadow-card transition-all duration-200 hover:shadow-soft hover:-translate-y-0.5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${accentBorders[accentColor]} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-ink-soft tracking-tight uppercase">{title}</p>
          <p className="text-2xl font-extrabold text-ink tabular tracking-tight font-display">
            {value}
          </p>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl shrink-0 ${iconStyles[accentColor]}`}>
            {icon}
          </div>
        )}
      </div>

      {(sublabel || trend) && (
        <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-xs">
          {sublabel && (
            <span className="text-ink-faint font-medium truncate">{sublabel}</span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-bold tabular px-2 py-0.5 rounded-full text-[11px] ${
                trend.isPositive !== false
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.isPositive !== false ? (
                <TrendingUp size={12} className="shrink-0" />
              ) : (
                <TrendingDown size={12} className="shrink-0" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
