import { Router } from 'express';
import type { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export const notificationRoutes = Router();

const PENDING_STATUS: TaskStatus[] = ['TODO', 'IN_PROGRESS'];

// Tareas "pendientes" del usuario: asignadas a él, en TODO o IN_PROGRESS.
const pendingWhere = (userId: string): Prisma.TaskWhereInput => ({
  assigneeId: userId,
  deletedAt: null,
  status: { in: PENDING_STATUS },
});

// GET /api/notifications/count — conteo de pendientes.
notificationRoutes.get('/count', requireAuth, async (req, res) => {
  const count = await prisma.task.count({ where: pendingWhere(req.user!.id) });
  res.json({ count });
});

// GET /api/notifications — lista de pendientes (priority desc, deadline asc).
notificationRoutes.get('/', requireAuth, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: pendingWhere(req.user!.id),
    orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
    take: 10,
    include: { project: { select: { name: true, slug: true } } },
  });
  res.json({ tasks });
});
