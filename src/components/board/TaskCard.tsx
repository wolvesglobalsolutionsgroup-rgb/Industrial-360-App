import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Sparkles, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle,
  Users
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export interface TaskCardProps {
  task: {
    id: string;
    wbsCode?: string;
    title: string;
    specialty?: string;
    status: string;
    plannedQuantity?: number;
    executedQuantity?: number;
    unit?: string;
    unitCost?: number;
    crewName?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    ptwRequired?: boolean;
    ptwStatus?: string;
    subtasks?: Array<{ id: string; text: string; completed: boolean }>;
    restrictionNotes?: string;
  };
  onProgressChange?: (taskId: string, delta: number) => void;
  onGenerateAISubtasks?: (task: any) => void;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  isGeneratingAI?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onProgressChange,
  onGenerateAISubtasks,
  onEdit,
  onDelete,
  isGeneratingAI = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const planned = task.plannedQuantity || 100;
  const executed = task.executedQuantity || 0;
  const progressPct = Math.min(100, Math.round((executed / planned) * 100));
  const valuationAmount = executed * (task.unitCost || 120);

  const priorityColors = {
    low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-surface border border-line rounded-2xl p-4 shadow-card hover:shadow-soft transition-all duration-200 space-y-3 ${
        isDragging ? 'ring-2 ring-brand-500 shadow-lift rotate-1' : ''
      }`}
    >
      {/* Header: WBS code + Specialty + Drag Handle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-surface-2 border border-line text-ink-soft">
            {task.wbsCode || 'WBS-0.0'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-500 border border-brand-500/20">
            {task.specialty || 'Mecánica'}
          </span>
          {task.priority && (
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          )}
        </div>

        {/* Drag handle button */}
        <div
          {...attributes}
          {...listeners}
          className="p-1 text-ink-faint hover:text-ink cursor-grab active:cursor-grabbing rounded-lg hover:bg-surface-2 transition-colors"
          title="Arrastrar partida"
        >
          <GripVertical size={16} />
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs sm:text-sm font-bold text-ink leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Progress Bar and Quantities */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-ink-soft font-semibold">
            {executed} / {planned} {task.unit || 'm'}
          </span>
          <span className="font-bold text-brand-500 tabular">{progressPct}%</span>
        </div>

        <div className="h-2 bg-surface-2 rounded-full overflow-hidden border border-line">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPct >= 100
                ? 'bg-emerald-500'
                : progressPct > 50
                ? 'bg-brand-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Valuation & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line text-xs">
        <div className="flex items-center gap-1 text-[11px] font-mono font-extrabold text-ink">
          <span className="text-ink-faint">Valuación:</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            ${valuationAmount.toLocaleString('en-US')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {task.ptwRequired && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldCheck size={11} /> PTW
            </span>
          )}
          {task.crewName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-soft">
              <Users size={11} /> {task.crewName}
            </span>
          )}
        </div>
      </div>

      {/* Subtasks summary if present */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-1 bg-surface-2 p-2 rounded-xl text-[11px]">
          <div className="flex items-center justify-between text-ink-soft font-bold">
            <span>Sub-actividades AI:</span>
            <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
          </div>
          <div className="space-y-1">
            {task.subtasks.slice(0, 2).map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 text-ink-soft truncate">
                <CheckCircle2 size={11} className={s.completed ? 'text-emerald-500' : 'text-ink-faint'} />
                <span className={`truncate ${s.completed ? 'line-through text-ink-faint' : ''}`}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restriction note banner */}
      {task.restrictionNotes && (
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-start gap-1.5">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span className="line-clamp-2">{task.restrictionNotes}</span>
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
        {/* Progress Adjusters */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onProgressChange?.(task.id, -10)}
            className="p-1 rounded-lg bg-surface-2 hover:bg-line text-ink-soft hover:text-ink transition-colors cursor-pointer"
            title="-10% avance"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={() => onProgressChange?.(task.id, 10)}
            className="p-1 rounded-lg bg-surface-2 hover:bg-line text-ink-soft hover:text-ink transition-colors cursor-pointer"
            title="+10% avance"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {onGenerateAISubtasks && (
            <button
              type="button"
              onClick={() => onGenerateAISubtasks(task)}
              disabled={isGeneratingAI}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Generar Desglose AI con Project Brain"
            >
              <Sparkles size={14} className={isGeneratingAI ? 'animate-spin' : ''} />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="Editar Partida"
            >
              <Edit3 size={14} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Eliminar Partida"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
