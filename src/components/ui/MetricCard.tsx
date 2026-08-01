import React from 'react';
import { Card, CardContent } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  accentColor?: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'slate' | 'error' | 'rose';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  sublabel,
  icon,
  trend,
  accentColor = 'emerald',
  className = '',
}) => {
  const accentBorders = {
    emerald: 'before:bg-emerald-500',
    cyan: 'before:bg-cyan-500',
    amber: 'before:bg-amber-500',
    indigo: 'before:bg-indigo-500',
    slate: 'before:bg-slate-500',
    error: 'before:bg-rose-500',
    rose: 'before:bg-rose-500',
  };

  const iconBgs = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
    error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  };

  return (
    <Card className={`relative overflow-hidden before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1.5 ${accentBorders[accentColor]} ${className}`}>
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wide text-ink-soft line-clamp-1">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-black text-ink font-mono tracking-tight select-none">
            {value}
          </div>
          
          {(sublabel || trend) && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              {trend && (
                <span className={`inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded-md ${
                  trend.direction === 'up' 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' 
                    : trend.direction === 'down'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    : 'bg-surface-2 text-ink-soft'
                }`}>
                  {trend.direction === 'up' && <TrendingUp size={12} />}
                  {trend.direction === 'down' && <TrendingDown size={12} />}
                  {trend.direction === 'neutral' && <Minus size={12} />}
                  {trend.value}
                </span>
              )}
              {sublabel && (
                <span className="text-ink-soft font-medium">
                  {sublabel}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className={`p-3 rounded-2xl ${iconBgs[accentColor]} shrink-0 shadow-2xs`}>
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
