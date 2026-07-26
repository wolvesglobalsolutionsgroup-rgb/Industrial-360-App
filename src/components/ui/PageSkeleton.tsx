import React from 'react';

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
      
      {/* KPI Stats Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>

      {/* Main Content Skeleton */}
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
    </div>
  );
}
