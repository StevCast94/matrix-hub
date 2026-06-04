import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { getVisibleProjectIds } from '../lib/scopedQuery';
import { syncAllMetrics } from '../services/metricsSync';

export const metricRoutes = Router();

// GET /api/metrics — todas las métricas de los proyectos visibles,
// agrupadas por proyecto. Incluye proyectos SIN endpoint (con flag).
metricRoutes.get('/', requireAuth, async (req, res) => {
  const { id, role } = req.user!;
  const visibleIds = await getVisibleProjectIds(id, role);

  const projects = await prisma.project.findMany({
    where: { id: { in: visibleIds }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: { metrics: { orderBy: { key: 'asc' } } },
  });

  const data = projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    url: p.url,
    status: p.status,
    hasMetricsEndpoint: !!p.metricsEndpoint,
    metrics: p.metrics,
  }));

  res.json({ projects: data });
});

// Middleware: permite cron (x-cron-secret) o pasa a requireAuth+SUPERADMIN.
function cronOrSuperadmin(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['x-cron-secret'] === cronSecret) {
    return next();
  }
  // No es cron: exigir SUPERADMIN autenticado.
  requireAuth(req, res, () => {
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  });
}

// POST /api/metrics/sync — dispara sync manual.
metricRoutes.post('/sync', cronOrSuperadmin, async (_req, res) => {
  const result = await syncAllMetrics();
  res.json({ result });
});
