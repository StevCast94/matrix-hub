import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { recordHeartbeat, toAgentStatus } from '../services/agentLiveness';

export const agentRoutes = Router();

// GET /api/agents — lista de agentes con estado online/offline.
agentRoutes.get('/', requireAuth, async (_req, res) => {
  const agents = await prisma.agent.findMany({ orderBy: { displayName: 'asc' } });
  res.json({ agents: agents.map(toAgentStatus) });
});

// POST /api/agents/:id/heartbeat — registrar señal de vida.
// Autoriza con x-agent-secret == AGENT_SECRET (procesos externos).
agentRoutes.post('/:id/heartbeat', async (req, res) => {
  const secret = process.env.AGENT_SECRET;
  if (secret && req.headers['x-agent-secret'] !== secret) {
    return res.status(401).json({ error: 'Secret inválido' });
  }

  const ts = typeof req.body?.ts === 'string' ? req.body.ts : undefined;
  const status = await recordHeartbeat(req.params.id, ts);
  if (!status) return res.status(404).json({ error: 'Agente no encontrado' });

  res.json({ agent: status });
});
