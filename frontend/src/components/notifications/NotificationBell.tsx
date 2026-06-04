import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { PriorityBadge } from '@/components/tasks/PriorityBadge';
import { relativeTime } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const tasks = data?.tasks ?? [];
  const count = tasks.length;

  return (
    <div className="relative">
      <button
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-sm font-semibold text-slate-700">Tareas pendientes</p>
            {tasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Nada pendiente 🎉</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tareas/${t.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <PriorityBadge priority={t.priority} />
                      <span className="text-xs text-slate-400">
                        {t.deadline ? `Vence ${relativeTime(t.deadline)}` : 'Sin fecha límite'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{t.title}</p>
                  </Link>
                ))}
              </div>
            )}
            <Link
              to="/mis-tareas"
              onClick={() => setOpen(false)}
              className="mt-3 block text-center text-sm text-sky-600 hover:underline"
            >
              Ver todas las tareas →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
