import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/auth';

export interface AuthedUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'SUPERADMIN' | 'COLLABORATOR';
  aiAssistant: 'COSMO' | 'WANDA';
  theme: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

/**
 * Verifica el JWT propio (firmado por el backend) en Authorization: Bearer <token>.
 * Auth self-hosted email+password — ya no depende de Supabase.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    if (user.deletedAt) {
      return res.status(403).json({ error: 'Usuario deshabilitado' });
    }

    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      aiAssistant: user.aiAssistant as 'COSMO' | 'WANDA',
      theme: user.theme,
    };

    next();
  } catch (err) {
    console.error('Error en requireAuth:', err);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}
