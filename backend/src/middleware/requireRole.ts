import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';

/**
 * Restringe una ruta a uno o más roles. Debe ir DESPUÉS de requireAuth.
 * Uso: router.get('/admin', requireAuth, requireRole('SUPERADMIN'), handler)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  };
}
