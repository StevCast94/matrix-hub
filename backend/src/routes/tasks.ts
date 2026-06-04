import { Router } from 'express';
import type { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { getVisibleProjectIds, getVisibleTaskIds } from '../lib/scopedQuery';
import { createTimelineEvent } from '../lib/timeline';

export const taskRoutes = Router();

const VALID_STATUS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

const taskInclude = {
  project: { select: { id: true, name: true, slug: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

// Construye el filtro de visibilidad para tareas según rol.
async function visibilityWhere(userId: string, role: 'SUPERADMIN' | 'COLLABORATOR') {
  if (role === 'SUPERADMIN') return {};
  const ids = await getVisibleTaskIds(userId, role);
  return { id: { in: ids } };
}

// GET /api/tasks — lista filtrable y scoped.
taskRoutes.get('/', requireAuth, async (req, res) => {
  const { id: userId, role } = req.user!;
  const { status, projectId, assigneeId, priority, search } = req.query;

  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    ...(await visibilityWhere(userId, role)),
    ...(status ? { status: status as TaskStatus } : {}),
    ...(projectId ? { projectId: projectId as string } : {}),
    ...(assigneeId ? { assigneeId: assigneeId as string } : {}),
    ...(priority ? { priority: priority as Prisma.TaskWhereInput['priority'] } : {}),
    ...(search
      ? { title: { contains: search as string, mode: 'insensitive' as const } }
      : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ priority: 'desc' }, { deadline: 'asc' }, { createdAt: 'desc' }],
  });

  res.json({ tasks });
});

// GET /api/tasks/:id — detalle.
taskRoutes.get('/:id', requireAuth, async (req, res) => {
  const { id: userId, role } = req.user!;
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: taskInclude,
  });
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

  if (role !== 'SUPERADMIN') {
    const ids = await getVisibleTaskIds(userId, role);
    if (!ids.includes(task.id)) return res.status(403).json({ error: 'Sin acceso a esta tarea' });
  }

  const events = await prisma.timelineEvent.findMany({
    where: { type: { startsWith: 'task_' }, metadata: { path: ['taskId'], equals: task.id } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({ task, events });
});

// POST /api/tasks — crear.
taskRoutes.post('/', requireAuth, async (req, res) => {
  const { id: userId, role } = req.user!;
  const { title, projectId, assigneeId, priority, approvalLevel, deadline, description } =
    req.body ?? {};

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title es requerido' });
  }

  // Si se asocia a un proyecto, el usuario debe poder verlo.
  if (projectId) {
    const visible = await getVisibleProjectIds(userId, role);
    if (!visible.includes(projectId)) {
      return res.status(403).json({ error: 'Sin acceso al proyecto indicado' });
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      projectId: projectId ?? null,
      assigneeId: assigneeId ?? null,
      priority: priority ?? undefined,
      approvalLevel: approvalLevel ?? undefined,
      deadline: deadline ? new Date(deadline) : null,
      createdById: userId,
    },
    include: taskInclude,
  });

  await createTimelineEvent({
    type: 'task_created',
    actorType: 'user',
    actorId: userId,
    projectId: task.projectId,
    title: `Tarea creada: ${task.title}`,
    metadata: { taskId: task.id },
  });

  res.status(201).json({ task });
});

// PUT /api/tasks/:id — actualizar campos permitidos.
taskRoutes.put('/:id', requireAuth, async (req, res) => {
  const { id: userId, role } = req.user!;
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada' });

  if (role !== 'SUPERADMIN') {
    const ids = await getVisibleTaskIds(userId, role);
    if (!ids.includes(existing.id)) return res.status(403).json({ error: 'Sin acceso' });
  }

  const { title, description, priority, approvalLevel, deadline, projectId, assigneeId } =
    req.body ?? {};

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      title: title ?? undefined,
      description: description === undefined ? undefined : description,
      priority: priority ?? undefined,
      approvalLevel: approvalLevel ?? undefined,
      deadline: deadline === undefined ? undefined : deadline ? new Date(deadline) : null,
      projectId: projectId === undefined ? undefined : projectId,
      assigneeId: assigneeId === undefined ? undefined : assigneeId,
    },
    include: taskInclude,
  });

  res.json({ task });
});

// PATCH /api/tasks/:id/status — cambiar estado con validación de approval gates.
taskRoutes.patch('/:id/status', requireAuth, async (req, res) => {
  const { id: userId, role } = req.user!;
  const { status, approvalNote } = req.body ?? {};

  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'status inválido' });
  }

  const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada' });

  if (role !== 'SUPERADMIN') {
    const ids = await getVisibleTaskIds(userId, role);
    if (!ids.includes(existing.id)) return res.status(403).json({ error: 'Sin acceso' });
  }

  // Approval gates al pasar a DONE.
  if (status === 'DONE' && existing.status !== 'DONE') {
    if (existing.approvalLevel === 'RED' && role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Esta tarea requiere aprobación de Stevens.' });
    }
    if (existing.approvalLevel === 'YELLOW' && !approvalNote) {
      return res
        .status(400)
        .json({ error: 'Se requiere una nota de cierre para completar esta tarea.' });
    }
  }

  const toDone = status === 'DONE' && existing.status !== 'DONE';

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      status,
      completedAt: toDone ? new Date() : status !== 'DONE' ? null : existing.completedAt,
    },
    include: taskInclude,
  });

  await createTimelineEvent({
    type: toDone ? 'task_done' : 'task_status_change',
    actorType: 'user',
    actorId: userId,
    projectId: task.projectId,
    title: toDone
      ? `Tarea completada: ${task.title}`
      : `Tarea movida a ${status}: ${task.title}`,
    body: approvalNote ?? null,
    metadata: { taskId: task.id, from: existing.status, to: status },
  });

  res.json({ task });
});

// PATCH /api/tasks/:id/assign — reasignar.
taskRoutes.patch('/:id/assign', requireAuth, async (req, res) => {
  const { id: userId, role } = req.user!;
  const { assigneeId } = req.body ?? {};

  const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada' });

  if (role !== 'SUPERADMIN') {
    const ids = await getVisibleTaskIds(userId, role);
    if (!ids.includes(existing.id)) return res.status(403).json({ error: 'Sin acceso' });
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: { assigneeId: assigneeId ?? null },
    include: taskInclude,
  });

  await createTimelineEvent({
    type: 'task_assigned',
    actorType: 'user',
    actorId: userId,
    projectId: task.projectId,
    title: `Tarea reasignada: ${task.title}`,
    metadata: { taskId: task.id, assigneeId: assigneeId ?? null },
  });

  res.json({ task });
});

// DELETE /api/tasks/:id — soft-delete (SUPERADMIN o creador).
taskRoutes.delete('/:id', requireAuth, async (req, res) => {
  const { id: userId, role } = req.user!;
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada' });

  if (role !== 'SUPERADMIN' && existing.createdById !== userId) {
    return res.status(403).json({ error: 'Solo el creador o un admin pueden eliminar' });
  }

  await prisma.task.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
  res.json({ ok: true });
});
