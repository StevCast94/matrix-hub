import { useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { ApprovalLevel, Priority, Task } from '../../../../shared/types';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  task?: Task | null; // si se pasa → modo edición
}

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const approvals: ApprovalLevel[] = ['GREEN', 'YELLOW', 'RED'];

export function TaskForm({ open, onClose, onSaved, task }: TaskFormProps) {
  const { user } = useAuth();
  const { data: projectsData } = useProjects();
  const projects = projectsData?.projects ?? [];
  const editing = !!task;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [projectId, setProjectId] = useState(task?.projectId ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'MEDIUM');
  const [approvalLevel, setApprovalLevel] = useState<ApprovalLevel>(task?.approvalLevel ?? 'GREEN');
  const [deadline, setDeadline] = useState(task?.deadline ? task.deadline.slice(0, 10) : '');
  const [assignMe, setAssignMe] = useState(task ? task.assigneeId === user?.id : false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      title,
      description: description || null,
      projectId: projectId || null,
      priority,
      approvalLevel,
      deadline: deadline || null,
      assigneeId: assignMe ? user?.id : editing ? task!.assigneeId : null,
    };
    try {
      if (editing) {
        await api(`/tasks/${task!.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/tasks', { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  }

  const selectClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400';

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar tarea' : 'Nueva tarea'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea
          className={selectClass}
          rows={3}
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <select className={selectClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Sin proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            className={selectClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                Prioridad: {p}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={approvalLevel}
            onChange={(e) => setApprovalLevel(e.target.value as ApprovalLevel)}
          >
            {approvals.map((a) => (
              <option key={a} value={a}>
                Approval: {a}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={assignMe} onChange={(e) => setAssignMe(e.target.checked)} />
          Asignármela a mí
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Guardando…' : editing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
