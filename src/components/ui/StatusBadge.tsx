import React from 'react';

export type TaskStatusType = 'planificada' | 'en_campo' | 'en_revision' | 'bloqueada' | 'terminada';
export type PriorityType = 'critica' | 'alta' | 'media' | 'baja';

export interface StatusBadgeProps {
  status?: TaskStatusType | string;
  priority?: PriorityType | string;
  customText?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  priority,
  customText,
  className = '',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (priority) {
    const priorityMap: Record<string, { label: string; bg: string }> = {
      critica: { label: '🔴 CRÍTICA', bg: 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800' },
      alta: { label: '🟠 ALTA', bg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
      media: { label: '🟡 MEDIA', bg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
      baja: { label: '🟢 BAJA', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
    };

    const config = priorityMap[priority.toLowerCase()] || { label: priority.toUpperCase(), bg: 'bg-slate-100 text-slate-700 border-slate-200' };

    return (
      <span className={`inline-flex items-center font-extrabold font-mono rounded-full border ${sizeClass} ${config.bg} ${className}`}>
        {customText || config.label}
      </span>
    );
  }

  const statusMap: Record<string, { label: string; bg: string }> = {
    planificada: { label: '📋 Planificada', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
    en_campo: { label: '🚜 En Campo', bg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    en_revision: { label: '🔍 En Revisión', bg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    bloqueada: { label: '🛑 Bloqueada', bg: 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse' },
    terminada: { label: '✅ Terminada', bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  };

  const key = (status || 'planificada').toLowerCase().replace(/\s+/g, '_');
  const config = statusMap[key] || { label: status || 'Desconocido', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center font-extrabold rounded-full border ${sizeClass} ${config.bg} ${className}`}>
      {customText || config.label}
    </span>
  );
};
