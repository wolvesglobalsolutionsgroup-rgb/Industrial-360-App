import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-2xs backdrop-blur-xs ${className}`}>
      <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center mb-4 shadow-2xs shrink-0">
        {icon || <FolderOpen size={32} />}
      </div>
      
      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-md font-medium leading-relaxed">
        {description}
      </p>

      {(onAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {onAction && actionLabel && (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
