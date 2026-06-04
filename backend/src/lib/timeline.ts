import { prisma } from './prisma';

interface CreateTimelineEventInput {
  organizationId?: string;
  type: string; // deploy, health_check, metric_sync, task_created, task_done, agent_online, ai_action
  actorType: string; // user, agent, cron, system
  actorId?: string | null;
  projectId?: string | null;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
}

const DEFAULT_ORG_SLUG = 'stevens-tech';

/**
 * Crea un TimelineEvent. Si no se pasa organizationId, lo deriva del
 * proyecto (si hay) o de la organización default.
 */
export async function createTimelineEvent(input: CreateTimelineEventInput): Promise<void> {
  let organizationId = input.organizationId ?? null;

  if (!organizationId && input.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { organizationId: true },
    });
    organizationId = project?.organizationId ?? null;
  }

  if (!organizationId) {
    const org = await prisma.organization.findUnique({
      where: { slug: DEFAULT_ORG_SLUG },
      select: { id: true },
    });
    organizationId = org?.id ?? null;
  }

  if (!organizationId) {
    console.warn('[timeline] No se pudo determinar organizationId; evento omitido:', input.title);
    return;
  }

  await prisma.timelineEvent.create({
    data: {
      organizationId,
      type: input.type,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      projectId: input.projectId ?? null,
      title: input.title,
      body: input.body ?? null,
      metadata: (input.metadata ?? undefined) as never,
    },
  });
}
