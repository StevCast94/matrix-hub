import { prisma } from '../lib/prisma';
import { createTimelineEvent } from '../lib/timeline';

export interface SyncResult {
  total: number;
  success: number;
  failed: number;
  startedAt: string;
  finishedAt: string;
}

// Estado del último sync — consultado por GET /api/health/sync.
let lastSyncResult: SyncResult | null = null;
export function getLastSyncResult(): SyncResult | null {
  return lastSyncResult;
}

const STALE_MS = 48 * 3600000;

interface RemoteMetric {
  value: number;
  label?: string;
  format?: string;
}

/**
 * Consume el /api/metrics de cada proyecto ACTIVE con metricsEndpoint y
 * actualiza la tabla Metric. Escribe TimelineEvent en cada sync (éxito o fallo).
 * NUNCA lee la BD de otro proyecto — solo el endpoint HTTP.
 */
export async function syncAllMetrics(): Promise<SyncResult> {
  const startedAt = new Date();

  const projects = await prisma.project.findMany({
    where: { status: 'ACTIVE', deletedAt: null, metricsEndpoint: { not: null } },
  });

  const result: SyncResult = {
    total: projects.length,
    success: 0,
    failed: 0,
    startedAt: startedAt.toISOString(),
    finishedAt: startedAt.toISOString(),
  };

  for (const project of projects) {
    try {
      const res = await fetch(project.metricsEndpoint!, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as { ts?: string | number; metrics: Record<string, RemoteMetric> };
      if (!data.metrics || typeof data.metrics !== 'object') {
        throw new Error('Respuesta sin campo "metrics"');
      }

      const verifiedAt = new Date(data.ts ?? Date.now());

      for (const [key, metric] of Object.entries(data.metrics)) {
        await prisma.metric.upsert({
          where: { projectId_key: { projectId: project.id, key } },
          create: {
            projectId: project.id,
            key,
            value: metric.value,
            label: metric.label ?? key,
            format: metric.format ?? 'number',
            source: `rest_api:${project.metricsEndpoint}`,
            verifiedAt,
            isStale: false,
          },
          update: {
            value: metric.value,
            label: metric.label ?? key,
            format: metric.format ?? 'number',
            verifiedAt,
            isStale: false,
          },
        });
      }

      await createTimelineEvent({
        type: 'metric_sync',
        actorType: 'cron',
        projectId: project.id,
        title: `Métricas de ${project.name} sincronizadas`,
        body: `${Object.keys(data.metrics).length} métricas actualizadas`,
        metadata: { project: project.slug, metricsCount: Object.keys(data.metrics).length },
      });

      result.success++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[metricsSync] ${project.slug} falló:`, message);

      // Si falla el sync, marcar sus métricas como stale.
      await prisma.metric.updateMany({
        where: { projectId: project.id },
        data: { isStale: true },
      });

      await createTimelineEvent({
        type: 'metric_sync',
        actorType: 'cron',
        projectId: project.id,
        title: `❌ Sync fallido: ${project.name}`,
        body: message,
        metadata: { project: project.slug, error: message },
      });

      result.failed++;
    }
  }

  // Marcar como stale cualquier métrica con verifiedAt > 48h.
  await prisma.metric.updateMany({
    where: { verifiedAt: { lt: new Date(Date.now() - STALE_MS) } },
    data: { isStale: true },
  });

  result.finishedAt = new Date().toISOString();
  lastSyncResult = result;
  return result;
}
