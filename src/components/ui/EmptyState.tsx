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
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface rounded-3xl border border-dashed border-line shadow-2xs ${className}`}>
      <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center mb-4 shadow-2xs shrink-0">
        {icon || <FolderOpen size={32} />}
      </div>
      
      <h3 className="text-lg font-black text-ink tracking-tight">
        {title}
      </h3>
      
      <p className="text-xs sm:text-sm text-ink-soft mt-1.5 max-w-md font-medium leading-relaxed">
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
