// Funciones que las IAs (Cosmo / Wanda) pueden ejecutar.
// TODAS llaman a los endpoints reales del backend usando el JWT del usuario:
// la IA no tiene acceso directo a la BD ni poderes especiales.

export interface AiFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, any>) => Promise<unknown>;
}

const baseUrl = () =>
  process.env.INTERNAL_API_URL || `http://localhost:${process.env.PORT || 3000}`;

// Ejecuta una llamada autenticada contra el propio backend.
async function callApi(jwt: string, path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export function getAiFunctions(jwt: string, userId: string): AiFunction[] {
  return [
    {
      name: 'getMetrics',
      description:
        'Obtener métricas verificadas. Si se pasa projectSlug, devuelve las de ese proyecto; si no, un resumen de todos los proyectos visibles.',
      parameters: {
        type: 'object',
        properties: {
          projectSlug: {
            type: 'string',
            description: 'Slug del proyecto (ej: imeldi-shop, omnidrive).',
          },
        },
      },
      execute: (args) =>
        args.projectSlug
          ? callApi(jwt, `/api/projects/${args.projectSlug}/metrics`)
          : callApi(jwt, '/api/metrics'),
    },
    {
      name: 'getTasks',
      description: 'Listar tareas visibles. Filtros opcionales: status, projectId, priority.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
          },
          projectId: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        },
      },
      execute: (args) => {
        const params = new URLSearchParams();
        if (args.status) params.set('status', args.status);
        if (args.projectId) params.set('projectId', args.projectId);
        if (args.priority) params.set('priority', args.priority);
        const qs = params.toString();
        return callApi(jwt, `/api/tasks${qs ? `?${qs}` : ''}`);
      },
    },
    {
      name: 'createTask',
      description: 'Crear una nueva tarea.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título de la tarea' },
          description: { type: 'string' },
          projectId: { type: 'string' },
          assigneeId: { type: 'string', description: 'ID del usuario asignado, o "me" para el usuario actual.' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        },
        required: ['title'],
      },
      execute: (args) =>
        callApi(jwt, '/api/tasks', 'POST', {
          ...args,
          assigneeId: args.assigneeId === 'me' ? userId : args.assigneeId,
        }),
    },
    {
      name: 'updateTaskStatus',
      description: 'Cambiar el estado de una tarea (mover entre columnas del kanban).',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
          },
          approvalNote: { type: 'string', description: 'Nota requerida para cerrar tareas YELLOW.' },
        },
        required: ['taskId', 'status'],
      },
      execute: (args) =>
        callApi(jwt, `/api/tasks/${args.taskId}/status`, 'PATCH', {
          status: args.status,
          approvalNote: args.approvalNote,
        }),
    },
    {
      name: 'getProjects',
      description: 'Listar los proyectos visibles para el usuario.',
      parameters: { type: 'object', properties: {} },
      execute: () => callApi(jwt, '/api/projects'),
    },
    {
      name: 'getMyTasks',
      description: 'Obtener las tareas asignadas al usuario actual.',
      parameters: { type: 'object', properties: {} },
      execute: () => callApi(jwt, `/api/tasks?assigneeId=${userId}`),
    },
    {
      name: 'getAgents',
      description: 'Listar agentes (Cosmo, Wanda) con su estado online/offline.',
      parameters: { type: 'object', properties: {} },
      execute: () => callApi(jwt, '/api/agents'),
    },
  ];
}

// Convierte las funciones al formato "tools" de OpenAI/DeepSeek.
export function toOpenAITools(fns: AiFunction[]) {
  return fns.map((f) => ({
    type: 'function' as const,
    function: { name: f.name, description: f.description, parameters: f.parameters },
  }));
}
