import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { projectRoutes } from './routes/projects';
import { metricRoutes } from './routes/metrics';
import { agentRoutes } from './routes/agents';

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

// 404 para /api/* no encontrado
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Servir frontend estático
const frontendPath = path.join(__dirname, '../public');
const hasBuild = fs.existsSync(path.join(frontendPath, 'index.html'));

if (hasBuild) {
  app.use(express.static(frontendPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.warn('⚠️ frontend/dist no encontrado. Ejecuta "cd frontend && npm run build"');
}

app.listen(PORT, () => {
  console.log(`🧠 Matrix Hub v2 corriendo en puerto ${PORT}`);
});
