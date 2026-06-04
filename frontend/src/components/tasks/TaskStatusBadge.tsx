import type { TaskStatus } from '../../../../shared/types';
import { statusConfig } from '@/lib/taskConfig';
import { cn } from '@/lib/utils';

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const c = statusConfig[status];
  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', c.bg, c.border)}
    >
      {c.label}
    </span>
  );
}
