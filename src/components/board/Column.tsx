import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Layers } from 'lucide-react';
import TaskCard, { TaskCardProps } from './TaskCard';

export interface ColumnProps {
  id: string;
  title: string;
  count: number;
  valuationTotal: number;
  colorAccent?: 'blue' | 'amber' | 'rose' | 'emerald';
  tasks: Array<TaskCardProps['task']>;
  onProgressChange?: (taskId: string, delta: number) => void;
  onGenerateAISubtasks?: (task: any) => void;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  onAddTask?: (columnId: string) => void;
  generatingTaskId?: string | null;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  count,
  valuationTotal,
  colorAccent = 'blue',
  tasks,
  onProgressChange,
  onGenerateAISubtasks,
  onEdit,
  onDelete,
  onAddTask,
  generatingTaskId,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const headerAccents = {
    blue: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10',
    amber: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    rose: 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/10',
    emerald: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  };

  const topBorders = {
    blue: 'border-t-blue-500',
    amber: 'border-t-amber-500',
    rose: 'border-t-rose-500',
    emerald: 'border-t-emerald-500',
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-surface-2/60 border border-line rounded-2xl border-t-4 ${topBorders[colorAccent]} p-3.5 sm:p-4 min-w-[280px] w-full max-w-sm transition-colors ${
        isOver ? 'bg-brand-500/5 ring-2 ring-brand-500' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-extrabold text-xs sm:text-sm text-ink tracking-tight">
            {title}
          </h3>
          <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${headerAccents[colorAccent]}`}>
            {count}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
            ${valuationTotal.toLocaleString('en-US')}
          </span>
          {onAddTask && (
            <button
              onClick={() => onAddTask(id)}
              className="p-1 rounded-lg bg-surface hover:bg-line text-ink transition-colors cursor-pointer"
              title="Agregar nueva partida"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Task Stack Container */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[220px] overflow-y-auto pr-0.5">
          {tasks.length === 0 ? (
            <div className="h-40 border-2 border-dashed border-line rounded-2xl flex flex-col items-center justify-center p-4 text-center text-ink-faint">
              <Layers size={24} className="mb-1 opacity-50" />
              <span className="text-xs font-semibold">Sin partidas en esta columna</span>
              <span className="text-[10px] mt-0.5">Arrastra partidas aquí</span>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onProgressChange={onProgressChange}
                onGenerateAISubtasks={onGenerateAISubtasks}
                onEdit={onEdit}
                onDelete={onDelete}
                isGeneratingAI={generatingTaskId === task.id}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default Column;
