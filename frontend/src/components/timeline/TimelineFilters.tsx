import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

interface Props {
  type?: string;
  projectId?: string;
  onChange: (next: { type?: string; projectId?: string }) => void;
}

const types = [
  { value: 'metric_sync', label: '✅ Métricas' },
  { value: 'deploy', label: '🚀 Deploy' },
  { value: 'task_created', label: '📋 Tareas' },
  { value: 'task_done', label: '✔️ Completadas' },
  { value: 'agent_online', label: '🤖 Agentes' },
];

export function TimelineFilters({ type, projectId, onChange }: Props) {
  const { data } = useProjects();
  const projects = data?.projects ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-400"
        value={projectId ?? ''}
        onChange={(e) => onChange({ type, projectId: e.target.value || undefined })}
      >
        <option value="">Todos los proyectos</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-1">
        {types.map((t) => {
          const active = type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onChange({ projectId, type: active ? undefined : t.value })}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition',
                active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
