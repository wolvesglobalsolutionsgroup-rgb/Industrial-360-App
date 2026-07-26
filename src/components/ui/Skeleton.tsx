import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({
  className = '',
  variant = 'rect'
}: SkeletonProps) {
  const base = "animate-pulse bg-slate-200 dark:bg-slate-800";
  
  const shapes = {
    text: "h-4 rounded-sm w-full",
    rect: "h-20 rounded-2xl w-full",
    circle: "h-10 w-10 rounded-full"
  };

  return (
    <div className={`${base} ${shapes[variant]} ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 space-y-4 shadow-2xs">
      <div className="flex justify-between items-center gap-3">
        <Skeleton variant="text" className="w-1/3 h-5" />
        <Skeleton variant="circle" />
      </div>
      <Skeleton variant="text" className="w-3/4 h-8" />
      <Skeleton variant="text" className="w-1/2 h-4" />
    </div>
  );
}

export default Skeleton;
