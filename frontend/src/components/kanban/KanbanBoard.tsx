import { useEffect, useRef, useState } from 'react';
import type { Task, TaskStatus } from '../../../../shared/types';
import { STATUS_ORDER } from '@/lib/taskConfig';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { KanbanColumn } from './KanbanColumn';
import { ApprovalGateModal } from '@/components/tasks/ApprovalGate';

interface KanbanBoardProps {
  tasks: Task[];
  onChanged: () => void;
}

export function KanbanBoard({ tasks, onChanged }: KanbanBoardProps) {
  const { user } = useAuth();
  const [local, setLocal] = useState<Task[]>(tasks);
  const dragged = useRef<string | null>(null);
  const [gate, setGate] = useState<{ task: Task; to: TaskStatus } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setLocal(tasks), [tasks]);

  async function commit(taskId: string, to: TaskStatus, approvalNote?: string) {
    const prev = local;
    // Optimistic update.
    setLocal((cur) => cur.map((t) => (t.id === taskId ? { ...t, status: to } : t)));
    try {
      await api(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: to, approvalNote }),
      });
      onChanged();
    } catch (err) {
      setLocal(prev); // rollback
      setError(err instanceof Error ? err.message : 'No se pudo mover la tarea');
      setTimeout(() => setError(null), 4000);
    }
  }

  function handleDrop(to: TaskStatus) {
    const taskId = dragged.current;
    dragged.current = null;
    if (!taskId) return;
    const task = local.find((t) => t.id === taskId);
    if (!task || task.status === to) return;

    // Approval gates al pasar a DONE.
    if (to === 'DONE' && task.status !== 'DONE' && task.approvalLevel !== 'GREEN') {
      if (task.approvalLevel === 'RED' && user?.role !== 'SUPERADMIN') {
        setError('Esta tarea requiere aprobación de Stevens.');
        setTimeout(() => setError(null), 4000);
        return;
      }
      setGate({ task, to });
      return;
    }
    void commit(taskId, to);
  }

  async function confirmGate(note?: string) {
    if (!gate) return;
    setBusy(true);
    await commit(gate.task.id, gate.to, note);
    setBusy(false);
    setGate(null);
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:overflow-x-auto lg:pb-2">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={local.filter((t) => t.status === status)}
            onDragStart={(id) => (dragged.current = id)}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {gate && (
        <ApprovalGateModal
          open
          taskTitle={gate.task.title}
          level={gate.task.approvalLevel}
          busy={busy}
          onClose={() => setGate(null)}
          onConfirm={confirmGate}
        />
      )}
    </div>
  );
}
