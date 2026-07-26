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
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/60',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    error: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
  };

  return (
    <Card className={`relative overflow-hidden before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1.5 ${accentBorders[accentColor]} ${className}`}>
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {value}
          </div>
          
          {(sublabel || trend) && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              {trend && (
                <span className={`inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded-md ${
                  trend.direction === 'up' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                    : trend.direction === 'down'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {trend.direction === 'up' && <TrendingUp size={12} />}
                  {trend.direction === 'down' && <TrendingDown size={12} />}
                  {trend.direction === 'neutral' && <Minus size={12} />}
                  {trend.value}
                </span>
              )}
              {sublabel && (
                <span className="text-slate-500 dark:text-slate-400 font-medium">
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
