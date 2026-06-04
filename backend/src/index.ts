import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { projectRoutes } from './routes/projects';
import { metricRoutes } from './routes/metrics';
import { agentRoutes } from './routes/agents';
import { taskRoutes } from './routes/tasks';
import { timelineRoutes } from './routes/timeline';
import { notificationRoutes } from './routes/notifications';
import { chatRoutes } from './routes/chat';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.use('/api/health', healthRoutes);

// Auth — sesión actual
app.use('/api/auth', authRoutes);

// Core Fase 1
app.use('/api/projects', projectRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/agents', agentRoutes);

// Core Fase 2
app.use('/api/tasks', taskRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/notifications', notificationRoutes);

// Core Fase 3 — Chat IA
app.use('/api/chat', chatRoutes);

// 404 para /api/* no encontrado
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Servir frontend estático
const frontendPath = path.join(__dirname, '../public');
const hasBuild = fs.existsSync(path.join(frontendPath, 'index.html'));

if (hasBuild) {
  app.use(express.static(frontendPath));
  // SPA fallback: serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.warn('⚠️ frontend/dist no encontrado. Ejecuta "cd frontend && npm run build"');
}

app.listen(PORT, () => {
  console.log(`🧠 Matrix Hub v2 corriendo en puerto ${PORT}`);
});
