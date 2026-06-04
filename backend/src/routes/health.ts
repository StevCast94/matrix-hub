import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { getLastSyncResult } from '../services/metricsSync';

export const healthRoutes = Router();

// GET /api/health/sync — estado del último sync de métricas.
healthRoutes.get('/sync', (_req, res) => {
  const last = getLastSyncResult();
  res.json({ lastSync: last ?? null });
});

// GET /api/health — health check con verificación de BD.
healthRoutes.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'up', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down', timestamp: new Date().toISOString() });
  }
});
