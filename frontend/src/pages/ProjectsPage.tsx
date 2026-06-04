import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, Modal, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';

const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  ARCHIVED: 'neutral',
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useProjects();
  const isAdmin = user?.role === 'SUPERADMIN';

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [metricsEndpoint, setMetricsEndpoint] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await api('/projects', {
        method: 'POST',
        body: JSON.stringify({ name, url: url || null, metricsEndpoint: metricsEndpoint || null }),
      });
      setOpen(false);
      setName('');
      setUrl('');
      setMetricsEndpoint('');
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setBusy(false);
    }
  }

  const projects = data?.projects ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">📁 Proyectos</h1>
        {isAdmin && <Button onClick={() => setOpen(true)}>+ Nuevo proyecto</Button>}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <EmptyState icon="❌" title="Error" description={error} />
      ) : projects.length === 0 ? (
        <EmptyState icon="📭" title="Sin proyectos" description="No hay proyectos para mostrar." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Link
                  to={`/proyectos/${p.slug}`}
                  className="font-semibold text-slate-900 hover:text-sky-600"
                >
                  {p.name}
                </Link>
                <Badge tone={statusTone[p.status] ?? 'neutral'}>{p.status}</Badge>
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-sky-600">
                  {p.url.replace(/^https?:\/\//, '')}
                </a>
              )}
              <p className="text-xs text-slate-400">
                {p.hosting ?? 'Sin hosting'} ·{' '}
                {p.metricsEndpoint ? 'métricas ✅' : 'sin endpoint ⚠️'}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo proyecto">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input placeholder="URL (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Input
            placeholder="metricsEndpoint (https://.../api/metrics)"
            value={metricsEndpoint}
            onChange={(e) => setMetricsEndpoint(e.target.value)}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creando…' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
