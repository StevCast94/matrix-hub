import { useState } from 'react';
import type { ApprovalLevel } from '../../../../shared/types';
import { approvalConfig } from '@/lib/taskConfig';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

export function ApprovalIndicator({ level }: { level: ApprovalLevel }) {
  const c = approvalConfig[level];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', c.color)}>
      {c.icon} {c.label}
    </span>
  );
}

interface ApprovalGateModalProps {
  open: boolean;
  taskTitle: string;
  level: ApprovalLevel;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  busy?: boolean;
}

/**
 * Modal de confirmación al mover una tarea a DONE.
 * YELLOW: pide nota. RED: el caller solo lo abre si el usuario es SUPERADMIN.
 */
export function ApprovalGateModal({
  open,
  taskTitle,
  level,
  onClose,
  onConfirm,
  busy,
}: ApprovalGateModalProps) {
  const [note, setNote] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="¿Confirmar finalización?">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-600">
            Tarea: <strong>{taskTitle}</strong>
          </p>
          <p className="mt-1 text-sm">
            <ApprovalIndicator level={level} />
          </p>
        </div>

        {level === 'YELLOW' && (
          <div>
            <label className="mb-1 block text-sm text-slate-600">Nota de cierre</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-sky-400"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe cómo se resolvió…"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={busy || (level === 'YELLOW' && !note.trim())}
            onClick={() => onConfirm(note.trim() || undefined)}
          >
            {busy ? 'Confirmando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
