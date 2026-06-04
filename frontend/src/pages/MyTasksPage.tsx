import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { Card, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { PriorityBadge } from '@/components/tasks/PriorityBadge';
import { formatDateShort } from '@/lib/utils';

export default function MyTasksPage() {
  const { user } = useAuth();
  const { data, loading, error } = useTasks({ assigneeId: user?.id });
  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">🙋 Mis tareas</h1>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <EmptyState icon="❌" title="Error" description={error} />
      ) : tasks.length === 0 ? (
        <EmptyState icon="🎉" title="Sin tareas asignadas" description="No tienes tareas por ahora." />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Link key={t.id} to={`/tareas/${t.id}`}>
              <Card className="flex items-center justify-between gap-3 py-3 hover:shadow-md">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.project?.name ?? 'Sin proyecto'}
                    {t.deadline && ` · 📅 ${formatDateShort(t.deadline)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <TaskStatusBadge status={t.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
