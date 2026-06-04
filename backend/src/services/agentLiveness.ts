import type { Agent } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { createTimelineEvent } from '../lib/timeline';

// Si un agente no envía heartbeat en este tiempo → offline.
export const HEARTBEAT_TTL_MS = 15 * 60 * 1000;

export interface AgentStatus {
  id: string;
  kind: string;
  displayName: string;
  emoji: string;
  isActive: boolean;
  lastHeartbeat: string | null;
  online: boolean;
}

export function isOnline(lastHeartbeat: Date | null): boolean {
  if (!lastHeartbeat) return false;
  return Date.now() - lastHeartbeat.getTime() < HEARTBEAT_TTL_MS;
}

export function toAgentStatus(agent: Agent): AgentStatus {
  return {
    id: agent.id,
    kind: agent.kind,
    displayName: agent.displayName,
    emoji: agent.emoji,
    isActive: agent.isActive,
    lastHeartbeat: agent.lastHeartbeat ? agent.lastHeartbeat.toISOString() : null,
    online: isOnline(agent.lastHeartbeat),
  };
}

/** Registra el heartbeat de un agente y emite evento al pasar offline→online. */
export async function recordHeartbeat(agentId: string, ts?: string): Promise<AgentStatus | null> {
  const existing = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!existing) return null;

  const wasOnline = isOnline(existing.lastHeartbeat);
  const when = ts ? new Date(ts) : new Date();

  const updated = await prisma.agent.update({
    where: { id: agentId },
    data: { lastHeartbeat: when },
  });

  if (!wasOnline) {
    await createTimelineEvent({
      type: 'agent_online',
      actorType: 'agent',
      actorId: updated.id,
      title: `${updated.displayName} está online ${updated.emoji}`,
    });
  }

  return toAgentStatus(updated);
}
