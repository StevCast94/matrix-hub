import { useState, type FormEvent } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle, signInWithPassword, user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-matrix-primary px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-matrix-primary text-2xl font-bold text-matrix-accent">
            M
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Matrix Hub</h1>
          <p className="text-sm text-slate-500">Sistema nervioso del ecosistema</p>
        </div>

        {user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-700">
              Sesión iniciada como <strong>{user.name}</strong> ({user.role})
            </p>
            <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
              Cerrar sesión
            </Button>
          </div>
        ) : (
          <>
            <Button className="w-full" variant="secondary" onClick={() => void handleGoogle()}>
              Iniciar sesión con Google
            </Button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">o</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-matrix-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              No hay registro público. Contacta a un administrador.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
