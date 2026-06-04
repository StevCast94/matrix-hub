import { useFetch } from './useFetch';
import type { Task } from '../../../shared/types';

export interface TaskFilters {
  status?: string;
  projectId?: string;
  assigneeId?: string;
  priority?: string;
  search?: string;
}

function toQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useTasks(filters: TaskFilters = {}) {
  return useFetch<{ tasks: Task[] }>(`/tasks${toQuery(filters)}`);
}
