import type { Priority } from '../../../../shared/types';
import { priorityConfig } from '@/lib/taskConfig';
import { cn } from '@/lib/utils';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = priorityConfig[priority];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', c.badge)}>
      {c.label}
    </span>
  );
}
