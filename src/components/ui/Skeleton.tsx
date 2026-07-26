import React from 'react';

export const Skeleton = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div 
    style={style}
    className={`animate-pulse bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl ${className}`}
  />
);

export const CardSkeleton = () => (
  <div className="p-6 bg-surface border border-line rounded-3xl space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);
