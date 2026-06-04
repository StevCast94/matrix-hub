import { useState } from 'react';
import { useTasks, type TaskFilters as Filters } from '@/hooks/useTasks';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskFilters } from '@/components/kanban/TaskFilters';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';

export default function KanbanPage() {
  const [filters, setFilters] = useState<Filters>({});
  const { data, loading, error, refetch } = useTasks(filters);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">✅ Tareas</h1>
        <Button onClick={() => setCreating(true)}>+ Nueva</Button>
      </div>

      <TaskFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : error ? (
        <EmptyState icon="❌" title="Error" description={error} />
      ) : (
        <KanbanBoard tasks={data?.tasks ?? []} onChanged={refetch} />
      )}

      <TaskForm open={creating} onClose={() => setCreating(false)} onSaved={refetch} />
    </div>
  );
}
