import type { NextFunction, Request, Response } from 'express';

/**
 * Autentica agentes externos (Timmy/OpenClaw, spokes) por secreto compartido.
 * Header: x-agent-secret. Mismo patrón que el heartbeat de agentes.
 * NO usa JWT de usuario — es para máquinas, no personas.
 */
export function requireAgentSecret(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.AGENT_SECRET;
  if (!expected) {
    return res.status(503).json({ error: 'AGENT_SECRET no configurado en el servidor' });
  }
  const got = req.headers['x-agent-secret'];
  if (got !== expected) {
    return res.status(401).json({ error: 'Agente no autorizado' });
  }
  next();
}
