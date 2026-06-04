import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { getVisibleProjectIds } from '../lib/scopedQuery';

export const timelineRoutes = Router();

// GET /api/timeline — eventos filtrables y paginados, scoped por proyectos visibles.
timelineRoutes.get('/', requireAuth, async (req, res) => {
  const { id: userId, role, organizationId } = req.user!;
  const { type, projectId, since, until } = req.query;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const where: Prisma.TimelineEventWhereInput = { organizationId };

  if (role !== 'SUPERADMIN') {
    const visibleProjects = await getVisibleProjectIds(userId, role);
    // Colaboradores ven eventos de sus proyectos (y eventos sin proyecto = globales).
    where.OR = [{ projectId: { in: visibleProjects } }, { projectId: null }];
  }

  if (type) where.type = type as string;
  if (projectId) where.projectId = projectId as string;
  if (since || until) {
    where.createdAt = {
      ...(since ? { gte: new Date(since as string) } : {}),
      ...(until ? { lte: new Date(until as string) } : {}),
    };
  }

  const [events, total] = await Promise.all([
    prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: offset,
      include: { project: { select: { name: true, slug: true } } },
    }),
    role === 'SUPERADMIN' ? prisma.timelineEvent.count({ where }) : Promise.resolve(undefined),
  ]);

  const hasMore = events.length > limit;
  res.json({ events: events.slice(0, limit), hasMore, total });
});
