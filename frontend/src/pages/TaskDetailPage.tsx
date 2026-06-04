import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { PriorityBadge } from '@/components/tasks/PriorityBadge';
import { ApprovalIndicator, ApprovalGateModal } from '@/components/tasks/ApprovalGate';
import { TaskForm } from '@/components/tasks/TaskForm';
import { STATUS_ORDER, statusConfig } from '@/lib/taskConfig';
import { formatDate, formatDateShort, relativeTime } from '@/lib/utils';
import type { Task, TaskStatus, TimelineEvent } from '../../../shared/types';

interface DetailResponse {
  task: Task;
  events: TimelineEvent[];
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch<DetailResponse>(id ? `/tasks/${id}` : null);
  const [editing, setEditing] = useState(false);
  const [gate, setGate] = useState<TaskStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !data) return <EmptyState icon="❌" title="No encontrada" description={error ?? ''} />;

  const { task, events } = data;

  async function changeStatus(status: TaskStatus, approvalNote?: string) {
    setBusy(true);
    setActionError(null);
    try {
      await api(`/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, approvalNote }),
      });
      setGate(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  function requestStatus(status: TaskStatus) {
    if (status === 'DONE' && task.status !== 'DONE' && task.approvalLevel !== 'GREEN') {
      if (task.approvalLevel === 'RED' && user?.role !== 'SUPERADMIN') {
        setActionError('Esta tarea requiere aprobación de Stevens.');
        return;
      }
      setGate('DONE');
      return;
    }
    void changeStatus(status);
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await api(`/tasks/${task.id}`, { method: 'DELETE' });
    navigate('/tareas');
  }

  const canDelete = user?.role === 'SUPERADMIN' || task.createdById === user?.id;

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/tareas" className="text-sm text-sky-600">
        ← Volver a tareas
      </Link>

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
      </div>

      <Card className="space-y-2 text-sm">
        <p>📁 Proyecto: {task.project?.name ?? '— sin proyecto —'}</p>
        <p>👤 Asignado: {task.assignee?.name ?? '— sin asignar —'}</p>
        <p>📅 Deadline: {task.deadline ? formatDateShort(task.deadline) : '— sin fecha —'}</p>
        <p className="flex items-center gap-2">
          🏷️ Estado: <TaskStatusBadge status={task.status} />
        </p>
        <p className="flex items-center gap-2">
          Approval: <ApprovalIndicator level={task.approvalLevel} />
        </p>
      </Card>

      {task.description && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-800">📝 Descripción</h2>
          <Card className="whitespace-pre-wrap text-sm text-slate-700">{task.description}</Card>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">📋 Historial</h2>
        {events.length === 0 ? (
          <p className="text-sm text-slate-400">Sin eventos.</p>
        ) : (
          <Card className="space-y-1 text-sm">
            {events.map((ev) => (
              <p key={ev.id} className="text-slate-600">
                · {ev.title}{' '}
                <span className="text-xs text-slate-400">({relativeTime(ev.createdAt)})</span>
              </p>
            ))}
          </Card>
        )}
      </section>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Editar
        </Button>
        {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
          <Button key={s} variant="ghost" disabled={busy} onClick={() => requestStatus(s)}>
            → {statusConfig[s].label}
          </Button>
        ))}
        {canDelete && (
          <Button variant="danger" onClick={() => void handleDelete()}>
            Eliminar
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-400">Creada el {formatDate(task.createdAt)}</p>

      <TaskForm open={editing} task={task} onClose={() => setEditing(false)} onSaved={refetch} />

      {gate && (
        <ApprovalGateModal
          open
          taskTitle={task.title}
          level={task.approvalLevel}
          busy={busy}
          onClose={() => setGate(null)}
          onConfirm={(note) => void changeStatus('DONE', note)}
        />
      )}
    </div>
  );
}
