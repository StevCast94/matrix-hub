import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  adminOnly?: boolean;
  disabled?: boolean;
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/proyectos', label: 'Proyectos', icon: '📁' },
  { to: '/tareas', label: 'Tareas', icon: '✅' },
  { to: '/mis-tareas', label: 'Mis tareas', icon: '🙋' },
  { to: '/aprobaciones', label: 'Aprobaciones', icon: '🔐' },
  { to: '/agentes', label: 'Agentes', icon: '🤖' },
  { to: '/timeline', label: 'Timeline', icon: '📜' },
  { to: '/admin', label: 'Admin', icon: '⚙️', adminOnly: true },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPERADMIN';

  return (
    <aside className="flex h-full w-60 flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-lg font-bold text-sky-400">
          M
        </div>
        <span className="font-semibold text-white">Matrix Hub</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items
          .filter((i) => !i.adminOnly || isAdmin)
          .map((item) =>
            item.disabled ? (
              <span
                key={item.to}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600"
                title="Próximamente"
              >
                <span>{item.icon}</span>
                {item.label}
                <span className="ml-auto text-[10px] uppercase">pronto</span>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ),
          )}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-500">v2 · Fase 1</div>
    </aside>
  );
}
