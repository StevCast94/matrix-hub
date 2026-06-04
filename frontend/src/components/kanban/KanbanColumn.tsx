import { useState } from 'react';
import type { Task, TaskStatus } from '../../../../shared/types';
import { statusConfig } from '@/lib/taskConfig';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onDragStart: (taskId: string) => void;
  onDrop: (status: TaskStatus) => void;
}

export function KanbanColumn({ status, tasks, onDragStart, onDrop }: KanbanColumnProps) {
  const [over, setOver] = useState(false);
  const c = statusConfig[status];

  return (
    <div className="flex w-full shrink-0 flex-col lg:w-72">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-slate-700">{c.label}</span>
        <span className="rounded-full bg-slate-200 px-2 text-xs font-medium text-slate-600">
          {tasks.length}
        </span>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onDrop(status);
        }}
        className={cn(
          'flex min-h-32 flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors',
          c.bg,
          over ? 'border-sky-400 ring-2 ring-sky-200' : c.border,
        )}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onDragStart={onDragStart} />
        ))}
        {tasks.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-slate-400">Sin tareas</p>
        )}
      </div>
    </div>
  );
}
