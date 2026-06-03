import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.use('/api/health', healthRoutes);

// Auth — sesión actual
app.use('/api/auth', authRoutes);

// 404 para /api/* no encontrado
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Servir frontend estático
const frontendPath = path.join(__dirname, '../../frontend/dist');
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
