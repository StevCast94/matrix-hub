import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAgentSecret } from '../middleware/agentSecret';

export const ingestRoutes = Router();

// Todas las rutas de ingesta requieren x-agent-secret (máquinas, no usuarios).
ingestRoutes.use(requireAgentSecret);

async function resolveProjectId(projectSlug?: string | null): Promise<string | null> {
  if (!projectSlug) return null;
  const p = await prisma.project.findUnique({ where: { slug: projectSlug } });
  return p?.id ?? null;
}

async function defaultOrgId(): Promise<string | null> {
  const org =
    (await prisma.organization.findUnique({ where: { slug: 'stevens-tech' } })) ??
    (await prisma.organization.findFirst());
  return org?.id ?? null;
}

/**
 * POST /api/ingest/event — registra un TimelineEvent en Matrix.
 * Body: { type, title, body?, actorId?, projectSlug?, metadata? }
 * Usado por Timmy (checkpoints, deploys, health, decisiones) y spokes.
 */
ingestRoutes.post('/event', async (req, res) => {
  try {
    const { type, title, body, actorId, projectSlug, metadata } = (req.body ?? {}) as {
      type?: string;
      title?: string;
      body?: string;
      actorId?: string;
      projectSlug?: string;
      metadata?: unknown;
    };

    if (!type || !title) {
      return res.status(400).json({ error: 'type y title son requeridos' });
    }

    const organizationId = await defaultOrgId();
    if (!organizationId) {
      return res.status(500).json({ error: 'No hay organización. Ejecuta el seed.' });
    }

    const event = await prisma.timelineEvent.create({
      data: {
        organizationId,
        type,
        actorType: 'agent',
        actorId: actorId ?? 'timmy',
        projectId: await resolveProjectId(projectSlug),
        title,
        body: body ?? null,
        metadata: (metadata ?? undefined) as never,
      },
    });

    res.status(201).json({ ok: true, id: event.id });
  } catch (err) {
    console.error('Error en /ingest/event:', err);
    res.status(500).json({ error: 'No se pudo registrar el evento' });
  }
});

/**
 * POST /api/ingest/memory — upsert de AiMemory (memoria compartida Timmy↔Cosmo↔Wanda).
 * Body: { key, content, scope?, projectSlug?, createdBy? }
 */
ingestRoutes.post('/memory', async (req, res) => {
  try {
    const { key, content, scope, projectSlug, createdBy } = (req.body ?? {}) as {
      key?: string;
      content?: string;
      scope?: 'GLOBAL' | 'USER' | 'PROJECT';
      projectSlug?: string;
      createdBy?: 'COSMO' | 'WANDA' | 'TIMMY';
    };

    if (!key || !content) {
      return res.status(400).json({ error: 'key y content son requeridos' });
    }

    const finalScope = scope ?? 'GLOBAL';
    const projectId = finalScope === 'PROJECT' ? await resolveProjectId(projectSlug) : null;

    // find-then-update/create: el unique compuesto incluye columnas nullable
    // (userId/projectId) y Postgres trata NULL como distinto, así que un upsert
    // directo podría duplicar. Resolvemos manualmente.
    const existing = await prisma.aiMemory.findFirst({
      where: { key, scope: finalScope, userId: null, projectId },
    });

    const memory = existing
      ? await prisma.aiMemory.update({ where: { id: existing.id }, data: { content } })
      : await prisma.aiMemory.create({
          data: { key, content, scope: finalScope, projectId, createdBy: createdBy ?? 'TIMMY' },
        });

    res.status(201).json({ ok: true, id: memory.id });
  } catch (err) {
    console.error('Error en /ingest/memory:', err);
    res.status(500).json({ error: 'No se pudo guardar la memoria' });
  }
});
