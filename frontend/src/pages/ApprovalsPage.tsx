import { Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { Card, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { ApprovalIndicator } from '@/components/tasks/ApprovalGate';

export default function ApprovalsPage() {
  const { data, loading, error } = useTasks();
  // Approval gates pendientes: YELLOW/RED que aún no están DONE.
  const tasks = (data?.tasks ?? []).filter(
    (t) => t.approvalLevel !== 'GREEN' && t.status !== 'DONE',
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">🔐 Aprobaciones pendientes</h1>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <EmptyState icon="❌" title="Error" description={error} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Nada por aprobar"
          description="No hay tareas con approval gates pendientes."
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Link key={t.id} to={`/tareas/${t.id}`}>
              <Card className="flex items-center justify-between gap-3 py-3 hover:shadow-md">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.project?.name ?? 'Sin proyecto'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ApprovalIndicator level={t.approvalLevel} />
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
