import React from 'react';
import { Skeleton, SkeletonCard } from './Skeleton';

export function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center gap-6">
        <div className="space-y-2.5 flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/6"></div>
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-32"></div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Large Content Table Placeholder */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4"></div>
        <div className="space-y-2">
          <div className="h-10 bg-slate-100 dark:bg-slate-950/60 rounded-xl"></div>
          <div className="h-12 bg-slate-50 dark:bg-slate-900/20 rounded-xl"></div>
          <div className="h-12 bg-slate-50 dark:bg-slate-900/20 rounded-xl"></div>
          <div className="h-12 bg-slate-50 dark:bg-slate-900/20 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;
