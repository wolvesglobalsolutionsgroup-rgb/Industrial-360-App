import React from 'react';

export const Skeleton = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div 
    style={style}
    className={`animate-pulse bg-slate-200/50 dark:bg-slate-800/40 rounded-xl ${className}`}
  />
);

export const CardSkeleton = () => (
  <div className="p-6 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);
