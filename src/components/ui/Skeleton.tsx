import React from 'react';

export const Skeleton = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div 
    style={style}
    className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl ${className}`}
  />
);

export const CardSkeleton = () => (
  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);
