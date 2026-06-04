import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { checkRateLimit } from '../lib/rateLimiter';
import { handleChatSend } from '../services/chatAI';

export const chatRoutes = Router();

// POST /api/chat/send — envía un mensaje y devuelve la respuesta como stream SSE.
chatRoutes.post('/send', requireAuth, async (req, res) => {
  const { message, agentId, conversationId } = req.body ?? {};
  if (!message) return res.status(400).json({ error: 'Mensaje requerido' });
  if (!agentId) return res.status(400).json({ error: 'agentId requerido' });

  if (!checkRateLimit(req.user!.id)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un momento.' });
  }

  const jwt = (req.headers.authorization ?? '').replace('Bearer ', '');

  // Cabeceras SSE.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    for await (const event of handleChatSend(
      req.user!.id,
      message,
      agentId,
      jwt,
      conversationId,
    )) {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al procesar mensaje';
    res.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
  } finally {
    res.end();
  }
});
