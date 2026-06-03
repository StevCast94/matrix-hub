import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

export const authRoutes = Router();

// GET /api/auth/me — devuelve el usuario autenticado (o 401).
authRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
