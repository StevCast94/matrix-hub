import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

// Email de Stevens — al primer login se autoasigna SUPERADMIN.
const SUPERADMIN_EMAIL = 'grupo_audiovisual_cs@hotmail.com';
const DEFAULT_ORG_SLUG = 'stevens-tech';

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
 * Verifica el JWT de Supabase en el header Authorization: Bearer <token>.
 * Si el usuario no existe aún en nuestra BD, lo crea (provisioning).
 * Stevens (SUPERADMIN_EMAIL) se crea con role SUPERADMIN.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const supaUser = data.user;
    const email = supaUser.email ?? '';

    // Buscar usuario en nuestra BD; crear si no existe.
    let user = await prisma.user.findUnique({ where: { id: supaUser.id } });

    if (!user) {
      const org = await prisma.organization.findUnique({ where: { slug: DEFAULT_ORG_SLUG } });
      if (!org) {
        return res.status(500).json({ error: 'Organización default no encontrada. Ejecuta el seed.' });
      }

      const meta = (supaUser.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (meta.full_name as string) ||
        (meta.name as string) ||
        email.split('@')[0] ||
        'Usuario';
      const avatarUrl = (meta.avatar_url as string) ?? (meta.picture as string) ?? null;

      user = await prisma.user.create({
        data: {
          id: supaUser.id,
          organizationId: org.id,
          email,
          name,
          avatarUrl,
          role: email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ? 'SUPERADMIN' : 'COLLABORATOR',
        },
      });
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
      aiAssistant: user.aiAssistant,
      theme: user.theme,
    };

    next();
  } catch (err) {
    console.error('Error en requireAuth:', err);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}
