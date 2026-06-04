import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <button
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Menú"
      >
        ☰
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notificaciones">
          🔔
        </button>
        {user && (
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                {initials(user.name)}
              </div>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
        )}
        <Button variant="ghost" onClick={() => void signOut()}>
          Salir
        </Button>
      </div>
    </header>
  );
}
