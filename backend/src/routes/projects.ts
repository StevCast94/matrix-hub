import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { getVisibleProjectIds } from '../lib/scopedQuery';
import { createTimelineEvent } from '../lib/timeline';

export const projectRoutes = Router();

// Helper: slug a partir de un nombre.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/projects — lista (scoped por usuario).
projectRoutes.get('/', requireAuth, async (req, res) => {
  const { id, role } = req.user!;
  const visibleIds = await getVisibleProjectIds(id, role);

  const projects = await prisma.project.findMany({
    where: { id: { in: visibleIds }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { tasks: true, metrics: true } } },
  });

  res.json({ projects });
});

// GET /api/projects/:slug — detalle.
projectRoutes.get('/:slug', requireAuth, async (req, res) => {
  const { id, role } = req.user!;
  const project = await prisma.project.findFirst({
    where: { slug: req.params.slug, deletedAt: null },
    include: { metrics: { orderBy: { key: 'asc' } } },
  });

  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const visibleIds = await getVisibleProjectIds(id, role);
  if (!visibleIds.includes(project.id)) {
    return res.status(403).json({ error: 'Sin acceso a este proyecto' });
  }

  const events = await prisma.timelineEvent.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.json({ project, events });
});

// GET /api/projects/:slug/metrics — métricas de un proyecto.
projectRoutes.get('/:slug/metrics', requireAuth, async (req, res) => {
  const { id, role } = req.user!;
  const project = await prisma.project.findFirst({
    where: { slug: req.params.slug, deletedAt: null },
    select: { id: true, name: true, slug: true, metricsEndpoint: true },
  });
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const visibleIds = await getVisibleProjectIds(id, role);
  if (!visibleIds.includes(project.id)) {
    return res.status(403).json({ error: 'Sin acceso a este proyecto' });
  }

  const metrics = await prisma.metric.findMany({
    where: { projectId: project.id },
    orderBy: { key: 'asc' },
  });

  res.json({ project, metrics });
});

// POST /api/projects — crear (SUPERADMIN).
projectRoutes.post('/', requireAuth, requireRole('SUPERADMIN'), async (req, res) => {
  const { name, url, domain, hosting, repoUrl, metricsEndpoint, status } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name es requerido' });

  const slug = slugify(name);
  const exists = await prisma.project.findUnique({ where: { slug } });
  if (exists) return res.status(409).json({ error: 'Ya existe un proyecto con ese slug' });

  const project = await prisma.project.create({
    data: {
      organizationId: req.user!.organizationId,
      name,
      slug,
      url: url ?? null,
      domain: domain ?? null,
      hosting: hosting ?? null,
      repoUrl: repoUrl ?? null,
      metricsEndpoint: metricsEndpoint ?? null,
      status: status ?? 'ACTIVE',
    },
  });

  await createTimelineEvent({
    organizationId: project.organizationId,
    type: 'project_created',
    actorType: 'user',
    actorId: req.user!.id,
    projectId: project.id,
    title: `Proyecto creado: ${project.name}`,
  });

  res.status(201).json({ project });
});

// PUT /api/projects/:id — actualizar (SUPERADMIN).
projectRoutes.put('/:id', requireAuth, requireRole('SUPERADMIN'), async (req, res) => {
  const { name, url, domain, hosting, repoUrl, metricsEndpoint, status } = req.body ?? {};

  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });
  if (!existing) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      name: name ?? undefined,
      url: url === undefined ? undefined : url,
      domain: domain === undefined ? undefined : domain,
      hosting: hosting === undefined ? undefined : hosting,
      repoUrl: repoUrl === undefined ? undefined : repoUrl,
      metricsEndpoint: metricsEndpoint === undefined ? undefined : metricsEndpoint,
      status: status ?? undefined,
    },
  });

  res.json({ project });
});

// DELETE /api/projects/:id — soft delete (SUPERADMIN).
projectRoutes.delete('/:id', requireAuth, requireRole('SUPERADMIN'), async (req, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });
  if (!existing) return res.status(404).json({ error: 'Proyecto no encontrado' });

  await prisma.project.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
  });

  res.json({ ok: true });
});
