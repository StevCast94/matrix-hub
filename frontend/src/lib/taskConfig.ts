import type { ApprovalLevel, Priority, TaskStatus } from '../../../shared/types';

export const statusConfig: Record<
  TaskStatus,
  { bg: string; border: string; label: string }
> = {
  BACKLOG: { bg: 'bg-slate-50', border: 'border-slate-300', label: 'Backlog' },
  TODO: { bg: 'bg-amber-50', border: 'border-amber-400', label: 'Por hacer' },
  IN_PROGRESS: { bg: 'bg-sky-50', border: 'border-sky-400', label: 'En progreso' },
  REVIEW: { bg: 'bg-purple-50', border: 'border-purple-400', label: 'Revisión' },
  DONE: { bg: 'bg-green-50', border: 'border-green-400', label: 'Completado' },
};

export const STATUS_ORDER: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const priorityConfig: Record<Priority, { badge: string; label: string }> = {
  LOW: { badge: 'bg-slate-100 text-slate-700', label: 'Baja' },
  MEDIUM: { badge: 'bg-amber-100 text-amber-700', label: 'Media' },
  HIGH: { badge: 'bg-red-100 text-red-700', label: 'Alta' },
  CRITICAL: { badge: 'bg-red-200 text-red-800', label: 'Crítica' },
};

export const approvalConfig: Record<
  ApprovalLevel,
  { icon: string; label: string; color: string }
> = {
  GREEN: { icon: '🟢', label: 'Automático', color: 'text-green-600' },
  YELLOW: { icon: '🟡', label: 'Requiere confirmación', color: 'text-amber-600' },
  RED: { icon: '🔴', label: 'Solo Stevens', color: 'text-red-600' },
};
