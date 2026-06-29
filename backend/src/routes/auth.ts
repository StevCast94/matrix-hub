import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { comparePassword, signToken } from '../lib/auth';

export const authRoutes = Router();

// POST /api/auth/login — email + password → JWT propio.
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Mensaje genérico para no revelar si el email existe.
    if (!user || !user.passwordHash || user.deletedAt) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken({ sub: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        aiAssistant: user.aiAssistant as 'COSMO' | 'WANDA',
        theme: user.theme,
      },
    });
  } catch (err) {
    console.error('Error en /auth/login:', err);
    res.status(500).json({ error: 'Error de autenticación' });
  }
});

// GET /api/auth/me — devuelve el usuario autenticado (o 401).
authRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
