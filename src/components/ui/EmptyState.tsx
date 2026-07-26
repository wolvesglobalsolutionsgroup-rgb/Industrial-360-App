import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 space-y-4 max-w-md mx-auto ${className}`}>
      {icon && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 rounded-3xl border border-slate-100 dark:border-slate-750">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Card>
  );
}

export default EmptyState;
