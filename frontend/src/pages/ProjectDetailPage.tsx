import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatMetricValue } from '@/lib/formatMetric';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button, Card, Input, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Metric, Project, TimelineEvent } from '../../../shared/types';

interface DetailResponse {
  project: Project & { metrics: Metric[] };
  events: TimelineEvent[];
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPERADMIN';
  const { data, loading, error, refetch } = useFetch<DetailResponse>(slug ? `/projects/${slug}` : null);

  const [editing, setEditing] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !data) return <EmptyState icon="❌" title="No encontrado" description={error ?? ''} />;

  const { project, events } = data;
  const metrics = project.metrics ?? [];
  const maxValue = Math.max(1, ...metrics.map((m) => m.value));

  async function saveEndpoint(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ metricsEndpoint: endpoint || null }),
      });
      setEditing(false);
      refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/proyectos" className="text-sm text-sky-600">
        ← Volver a proyectos
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">🏢 {project.name}</h1>
        <p className="text-sm text-slate-500">
          {project.status === 'ACTIVE' ? '🟢 Activo' : project.status}
          {project.url && ` · ${project.url.replace(/^https?:\/\//, '')}`}
        </p>
        {(project.hosting || project.repoUrl) && (
          <p className="text-xs text-slate-400">
            {project.hosting}
            {project.repoUrl && ` · ${project.repoUrl.replace(/^https?:\/\//, '')}`}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">📊 Métricas en tiempo real</h2>
        {metrics.length === 0 ? (
          <EmptyState
            icon="⚠️"
            title="Sin métricas"
            description={
              project.metricsEndpoint
                ? 'Aún no se han sincronizado métricas.'
                : 'Este proyecto no tiene endpoint de métricas configurado.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {metrics.map((m) => (
              <MetricCard key={m.id} metric={m} />
            ))}
          </div>
        )}
      </section>

      {metrics.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">📈 Comparación de métricas</h2>
          <Card className="space-y-2">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs text-slate-500">
                  {m.label ?? m.key}
                </span>
                <div className="h-4 flex-1 rounded bg-slate-100">
                  <div
                    className="h-4 rounded bg-sky-500"
                    style={{ width: `${(m.value / maxValue) * 100}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right font-mono text-xs text-slate-700">
                  {formatMetricValue(m.value, m.format)}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">📋 Últimos eventos</h2>
        {events.length === 0 ? (
          <p className="text-sm text-slate-400">Sin eventos registrados.</p>
        ) : (
          <Card className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-2 text-sm">
                <span className="text-slate-400">·</span>
                <div>
                  <span className="text-slate-700">{ev.title}</span>
                  <span className="ml-2 text-xs text-slate-400">{formatDate(ev.createdAt)}</span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">⚙️ Configuración</h2>
          <Card>
            {editing ? (
              <form onSubmit={saveEndpoint} className="space-y-3">
                <Input
                  placeholder="https://proyecto.com/api/metrics"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Guardando…' : 'Guardar'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  metricsEndpoint:{' '}
                  <code className="text-slate-800">{project.metricsEndpoint ?? '— no configurado —'}</code>
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEndpoint(project.metricsEndpoint ?? '');
                    setEditing(true);
                  }}
                >
                  Editar
                </Button>
              </div>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}
