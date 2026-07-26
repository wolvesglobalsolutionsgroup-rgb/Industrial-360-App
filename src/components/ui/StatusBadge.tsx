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
    success: "bg-success-light text-success border-success-light/60",
    warning: "bg-warning-light text-warning border-warning-light/60",
    error: "bg-error-light text-error border-error-light/60",
    info: "bg-info-light text-info border-info-light/60",
    neutral: "bg-surface-2 text-ink-soft border-line"
  };

  const dots = {
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
    info: "bg-info",
    neutral: "bg-ink-faint"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${styles[variant]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{status}</span>
    </span>
  );
}

export default StatusBadge;
