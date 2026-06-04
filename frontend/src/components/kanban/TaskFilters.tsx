import { useProjects } from '@/hooks/useProjects';
import type { TaskFilters as Filters } from '@/hooks/useTasks';
import { priorityConfig } from '@/lib/taskConfig';
import { cn } from '@/lib/utils';
import type { Priority } from '../../../../shared/types';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function TaskFilters({ filters, onChange }: Props) {
  const { data } = useProjects();
  const projects = data?.projects ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-400"
        placeholder="Buscar…"
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
      />
      <select
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-400"
        value={filters.projectId ?? ''}
        onChange={(e) => onChange({ ...filters, projectId: e.target.value || undefined })}
      >
        <option value="">Todos los proyectos</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        {priorities.map((p) => {
          const active = filters.priority === p;
          return (
            <button
              key={p}
              onClick={() => onChange({ ...filters, priority: active ? undefined : p })}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium transition',
                active ? priorityConfig[p].badge : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {priorityConfig[p].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
