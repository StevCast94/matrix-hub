import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMetrics } from '@/hooks/useMetrics';
import { useAgents } from '@/hooks/useAgents';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { ProjectSummaryCard } from '@/components/dashboard/ProjectSummaryCard';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useMetrics();
  const { data: agentsData } = useAgents();

  const projects = data?.projects ?? [];

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
    const staleMetrics = projects.reduce(
      (acc, p) => acc + p.metrics.filter((m) => m.isStale).length,
      0,
    );
    const onlineAgents = (agentsData?.agents ?? []).filter((a) => a.online).length;
    return [
      { label: 'Proyectos activos', value: activeProjects, icon: '📁' },
      { label: 'Tareas pendientes', value: 0, icon: '✅' },
      { label: 'Agentes online', value: onlineAgents, icon: '🤖', tone: 'success' as const },
      {
        label: 'Métricas stale',
        value: staleMetrics,
        icon: '⚠️',
        tone: staleMetrics > 0 ? ('warning' as const) : ('default' as const),
      },
    ];
  }, [projects, agentsData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        👋 Hola, {user?.name ?? 'usuario'}
      </h1>

      <QuickStats stats={stats} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">📊 Métricas por proyecto</h2>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <EmptyState icon="❌" title="Error al cargar métricas" description={error} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No hay proyectos visibles"
            description="No tienes proyectos asignados todavía."
          />
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <ProjectSummaryCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
