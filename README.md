# 🧠 Matrix Hub v2

Sistema nervioso central del ecosistema de Stevens. Orquesta proyectos, conecta colaboradores con asistentes IA y muestra métricas verificadas en tiempo real.

**Stack:** React 19 + Vite 6 + Tailwind v4 + Express + Prisma + Railway PostgreSQL + Supabase Auth.

---

## Estructura

```
matrix-hub/
├── frontend/    # React 19 + Vite 6 + Tailwind v4 (HashRouter)
├── backend/     # Express + Prisma + tsx (sirve frontend/dist en prod)
├── shared/      # Tipos compartidos
└── railway.json # Deploy config (NIXPACKS)
```

---

## Setup local

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # rellenar DATABASE_URL, DIRECT_URL, SUPABASE_*
npx prisma generate
npx prisma migrate dev --name init
npm run seed                # 1 org, 2 agentes (Cosmo, Wanda), 6 proyectos
npm run dev                 # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # rellenar VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev                 # http://localhost:5173 (proxy /api → :3000)
```

---

## Deploy (Railway)

Railway **no reconstruye** el frontend. El flujo es:

```bash
cd frontend && npm run build   # genera frontend/dist
git add frontend/dist && git commit -m "build"
git push                       # Railway despliega backend + sirve dist/
```

`railway.json` ejecuta en cada deploy:
`prisma generate → prisma migrate deploy → tsx src/index.ts`

### Railway secrets requeridas

| Secret | Valor |
|---|---|
| `DATABASE_URL` | Railway PostgreSQL (pooled) |
| `DIRECT_URL` | Conexión directa (para migrate) |
| `SUPABASE_URL` | https://rkwbixidpaqweavghfea.supabase.co |
| `SUPABASE_ANON_KEY` | `eyJhbG...` |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` |
| `CRON_SECRET` | secret para `POST /api/metrics/sync` |
| `AGENT_SECRET` | secret para heartbeats de agentes |

---

## Auth

- **1 solo Supabase Auth** para todos. Stevens es un `User` más con role `SUPERADMIN`.
- Habilitar en Supabase: **email/password + Google OAuth**.
- En el primer login, el middleware `auth.ts` crea el `User` automáticamente.
  Stevens (`grupo_audiovisual_cs@hotmail.com`) recibe role `SUPERADMIN`; el resto `COLLABORATOR`.

---

## API

### Fase 0
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check + estado BD |
| GET | `/api/health/sync` | Estado del último sync de métricas |
| GET | `/api/auth/me` | Usuario autenticado (401 si no) |

### Fase 1 — Proyectos
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/projects` | Auth (scoped: Stevens todos, colab. asignados) |
| GET | `/api/projects/:slug` | Auth + scope |
| GET | `/api/projects/:slug/metrics` | Auth + scope |
| POST | `/api/projects` | SUPERADMIN |
| PUT | `/api/projects/:id` | SUPERADMIN |
| DELETE | `/api/projects/:id` | SUPERADMIN (soft-delete) |

### Fase 1 — Métricas y agentes
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/metrics` | Auth + scope (agrupadas por proyecto) |
| POST | `/api/metrics/sync` | `x-cron-secret: $CRON_SECRET` **o** SUPERADMIN |
| GET | `/api/agents` | Auth |
| POST | `/api/agents/:id/heartbeat` | `x-agent-secret: $AGENT_SECRET` |

### Fase 2 — Tareas, Timeline y Notificaciones
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/tasks` | Auth + scope (`?status&projectId&assigneeId&priority&search`) |
| GET | `/api/tasks/:id` | Auth + scope |
| POST | `/api/tasks` | Auth |
| PUT | `/api/tasks/:id` | Auth + scope |
| PATCH | `/api/tasks/:id/status` | Auth + approval gates (YELLOW→nota, RED→SUPERADMIN) |
| PATCH | `/api/tasks/:id/assign` | Auth + scope |
| DELETE | `/api/tasks/:id` | SUPERADMIN o creador |
| GET | `/api/timeline` | Auth + scope (`?type&projectId&since&until&limit&offset`) |
| GET | `/api/notifications` | Auth (pendientes del usuario) |
| GET | `/api/notifications/count` | Auth |

**Frontend Fase 2:** Kanban con drag & drop HTML5 nativo (optimistic update + rollback), detalle de tarea con historial, Mis Tareas, Aprobaciones, Timeline agrupado por día, NotificationBell. Toda acción de tarea escribe un `TimelineEvent` (`task_created`, `task_status_change`, `task_done`, `task_assigned`).

### Fase 3 — Chat IA (Cosmo & Wanda)
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/chat/send` | Auth + rate limit; responde **SSE** (`token`/`function`/`done`/`error`) |

- **1 motor, 2 personalidades:** mismo proxy, system prompt leído de la tabla `Agent`.
- **DeepSeek** (OpenAI-compatible, function calling + streaming) primario; **Google Gemini** fallback (sin tools) si DeepSeek falla.
- **7 funciones IA** ejecutadas con el **JWT del usuario** contra los endpoints reales (sin acceso directo a BD): `getMetrics, getTasks, createTask, updateTaskStatus, getProjects, getMyTasks, getAgents`.
- Cada acción se registra en **AuditLog** (`actorKind: agent:cosmo|agent:wanda`).
- **Rate limit** 10 req/min por usuario (en memoria). Conversaciones en memoria (no persistidas).
- Variables Railway: `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `GOOGLE_AI_API_KEY`, `INTERNAL_API_URL` (vacío → `http://localhost:$PORT`), `RATE_LIMIT_PER_MINUTE`.

> **Build del frontend:** Vite ahora emite directamente a `backend/public/` (servido por Express). Ejecuta `cd frontend && npm run build`, commitea `backend/public/` y push.

### Métricas verificadas (lección de v1)
- Toda métrica tiene `verifiedAt` + `source`. Badge ✅ <6h, 🟡 6–48h, ⚠️ STALE >48h.
- El sync consume el `/api/metrics` HTTP de cada proyecto (nunca su BD).
- Cada sync escribe un `TimelineEvent` (éxito y fallo); si falla, marca las métricas como stale.
- Formato esperado del endpoint remoto:
  `{ "ts": "ISO8601", "metrics": { "products_active": { "value": 299, "label": "Productos activos", "format": "number" } } }`

### Cron de sincronización (Railway)
Crea un **Railway Cron** (cada 6h, `0 */6 * * *`) que dispare:
```bash
curl -X POST https://<tu-app>/api/metrics/sync -H "x-cron-secret: $CRON_SECRET"
```

---

## Tareas manuales pendientes (requieren tus cuentas)

1. Crear repo GitHub `StevCast94/matrix-hub` y `git push`.
2. Crear proyecto Railway + PostgreSQL; copiar `DATABASE_URL` / `DIRECT_URL`.
3. En Supabase: habilitar Google OAuth y añadir `redirectTo` (origin de prod).
4. Cargar las secrets en Railway.
5. `npm run build` del frontend, commitear `dist/`, push.
