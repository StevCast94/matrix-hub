import { Link } from 'react-router-dom';
import type { ProjectWithMetrics } from '../../../../shared/types';
import { MetricCard } from './MetricCard';

const statusDot: Record<string, string> = {
  ACTIVE: '🟢',
  PAUSED: '🟡',
  ARCHIVED: '⚪',
};

export function ProjectSummaryCard({ project }: { project: ProjectWithMetrics }) {
  const hasMetrics = project.metrics.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            to={`/proyectos/${project.slug}`}
            className="text-base font-semibold text-slate-900 hover:text-sky-600"
          >
            {project.name}
          </Link>
          <p className="text-xs text-slate-500">
            {statusDot[project.status] ?? '⚪'}{' '}
            {project.status === 'ACTIVE' ? 'Activo' : project.status}
            {project.url && ` · ${project.url.replace(/^https?:\/\//, '')}`}
          </p>
        </div>
      </div>

      {!project.hasMetricsEndpoint ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          ⚠️ Este proyecto no tiene <code>/api/metrics</code> configurado. Configura{' '}
          <code>metricsEndpoint</code> en Admin.
        </div>
      ) : !hasMetrics ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Sin métricas verificadas todavía. Ejecuta una sincronización.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {project.metrics.map((m) => (
            <MetricCard key={m.id} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
}
