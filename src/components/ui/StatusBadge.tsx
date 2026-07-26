import React from 'react';

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  variant = 'neutral',
  pulse = false,
  className = ''
}: StatusBadgeProps) {
  const styles = {
    success: "bg-emerald-55 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40",
    warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40",
    error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40",
    info: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/40",
    neutral: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700/60"
  };

  const dots = {
    success: "bg-emerald-600 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    error: "bg-red-500 dark:bg-red-400",
    info: "bg-sky-500 dark:bg-sky-400",
    neutral: "bg-slate-500 dark:bg-slate-400"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${styles[variant]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{status}</span>
    </span>
  );
}

export default StatusBadge;
