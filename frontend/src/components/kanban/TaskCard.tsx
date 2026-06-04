import { useNavigate } from 'react-router-dom';
import type { Task } from '../../../../shared/types';
import { PriorityBadge } from '@/components/tasks/PriorityBadge';
import { approvalConfig } from '@/lib/taskConfig';
import { formatDateShort } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDragStart: (taskId: string) => void;
}

export function TaskCard({ task, onDragStart }: TaskCardProps) {
  const navigate = useNavigate();

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onClick={() => navigate(`/tareas/${task.id}`)}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-1 flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        <span title={approvalConfig[task.approvalLevel].label}>
          {approvalConfig[task.approvalLevel].icon}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-900">{task.title}</p>
      <p className="mt-1 text-xs text-slate-500">
        {task.project ? `📁 ${task.project.name}` : '📁 Sin proyecto'}
        {task.assignee && ` · 👤 ${task.assignee.name}`}
      </p>
      {task.deadline && (
        <p className="mt-1 text-xs text-slate-400">📅 {formatDateShort(task.deadline)}</p>
      )}
      {task.description && (
        <p className="mt-2 line-clamp-1 text-xs text-slate-400">{task.description}</p>
      )}
    </div>
  );
}
