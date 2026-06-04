import { randomUUID } from 'crypto';
import type { AssistantKind } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getAiFunctions, toOpenAITools, type AiFunction } from './aiFunctions';

export interface SSEEvent {
  type: 'token' | 'function' | 'done' | 'error';
  data: unknown;
}

// Mensaje en formato OpenAI/DeepSeek.
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

// Conversaciones en memoria (no se persisten en BD en este MVP).
const conversations = new Map<string, ChatMessage[]>();

const MAX_TOOL_ROUNDS = 5;
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

interface UserWithProjects {
  name: string;
  email: string;
  role: string;
  projectAssignments: { project: { name: string; slug: string } }[];
}

function buildSystemPrompt(agentPrompt: string, user: UserWithProjects): string {
  const projects =
    user.projectAssignments.length > 0
      ? user.projectAssignments.map((a) => `${a.project.name} (${a.project.slug})`).join(', ')
      : user.role === 'SUPERADMIN'
        ? 'todos los proyectos del ecosistema'
        : 'ninguno asignado';

  return `${agentPrompt}

--- CONTEXTO ---
Usuario actual: ${user.name} (${user.email}), rol ${user.role}.
Proyectos visibles: ${projects}.
Zona horaria: America/Guayaquil (GMT-5).

Tienes funciones para consultar métricas, tareas y proyectos, y para crear/mover tareas.
Úsalas cuando el usuario pida datos reales en lugar de inventar información.
Si una acción falla, discúlpate brevemente y explica qué pasó, sin inventar resultados.
Responde siempre en español.`;
}

// --- Streaming desde DeepSeek (OpenAI-compatible) ---
async function* streamDeepSeek(
  messages: ChatMessage[],
  tools: ReturnType<typeof toOpenAITools>,
): AsyncGenerator<{ contentDelta?: string; toolCallDeltas?: any[]; finishReason?: string }> {
  const apiKey = 'sk-202b9a57542f40a185010d8be360ec27';
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY no configurada');

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages,
      tools: tools.length ? tools : undefined,
      tool_choice: tools.length ? 'auto' : undefined,
      stream: true,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok || !res.body) {
    throw new Error(`DeepSeek HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload);
        const choice = json.choices?.[0];
        if (!choice) continue;
        yield {
          contentDelta: choice.delta?.content ?? undefined,
          toolCallDeltas: choice.delta?.tool_calls ?? undefined,
          finishReason: choice.finish_reason ?? undefined,
        };
      } catch {
        /* línea parcial, se ignora */
      }
    }
  }
}

// Fusiona deltas de tool_calls (cada delta trae partes por índice).
function mergeToolCalls(acc: ToolCall[], deltas: any[]) {
  for (const d of deltas) {
    const i = d.index ?? 0;
    if (!acc[i]) acc[i] = { id: d.id ?? '', type: 'function', function: { name: '', arguments: '' } };
    if (d.id) acc[i].id = d.id;
    if (d.function?.name) acc[i].function.name += d.function.name;
    if (d.function?.arguments) acc[i].function.arguments += d.function.arguments;
  }
}

// Fallback eliminado — solo DeepSeek

async function logAction(userId: string, kind: AssistantKind, fnName: string, args: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorKind: `agent:${kind.toLowerCase()}`,
        action: `ai.${fnName}`,
        metadata: (args ?? undefined) as never,
      },
    });
  } catch (err) {
    console.error('[chatAI] no se pudo escribir AuditLog:', err);
  }
}

/**
 * Maneja un mensaje de chat y devuelve un generador de eventos SSE.
 * La IA ejecuta funciones con el JWT del usuario (misma identidad/permisos).
 */
export async function* handleChatSend(
  userId: string,
  message: string,
  agentId: string,
  jwt: string,
  conversationId?: string,
): AsyncGenerator<SSEEvent> {
  // 1. Agente (por ID o por kind COSMO/WANDA).
  const agent = await prisma.agent.findFirst({
    where: agentId === 'COSMO' || agentId === 'WANDA' ? { kind: agentId } : { id: agentId },
  });
  if (!agent || !agent.isActive) {
    yield { type: 'error', data: { message: 'Agente no disponible' } };
    return;
  }

  // 2. Usuario + proyectos.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projectAssignments: { include: { project: { select: { name: true, slug: true } } } },
    },
  });
  if (!user) {
    yield { type: 'error', data: { message: 'Usuario no encontrado' } };
    return;
  }

  // 3. Conversación (en memoria).
  const convId = conversationId && conversations.has(conversationId) ? conversationId : randomUUID();
  let messages = conversations.get(convId);
  if (!messages) {
    messages = [{ role: 'system', content: buildSystemPrompt(agent.systemPrompt, user) }];
    conversations.set(convId, messages);
  }
  messages.push({ role: 'user', content: message });

  // 4. Funciones disponibles.
  const fns: AiFunction[] = getAiFunctions(jwt, userId);
  const tools = toOpenAITools(fns);

  // 5. Loop de razonamiento + function calling.
  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let assistantContent = '';
      const toolCalls: ToolCall[] = [];
      let finishReason: string | undefined;

      try {
        for await (const chunk of streamDeepSeek(messages, tools)) {
          if (chunk.contentDelta) {
            assistantContent += chunk.contentDelta;
            yield { type: 'token', data: chunk.contentDelta };
          }
          if (chunk.toolCallDeltas) mergeToolCalls(toolCalls, chunk.toolCallDeltas);
          if (chunk.finishReason) finishReason = chunk.finishReason;
        }
      } catch (deepseekErr) {
        // Fallback a Google AI (sin function calling).
        console.error('[chatAI] DeepSeek falló, usando fallback Google:', deepseekErr);
        const text = 'Lo siento, no pude completar esa acción. Intenta de nuevo más tarde.';
        yield { type: 'token', data: text };
        messages.push({ role: 'assistant', content: text });
        yield { type: 'done', data: { conversationId: convId, usage: { tokens: 0 } } };
        return;
      }

      // Registrar el turno del asistente.
      messages.push({
        role: 'assistant',
        content: assistantContent || null,
        tool_calls: toolCalls.length ? toolCalls : undefined,
      });

      if (finishReason === 'tool_calls' && toolCalls.length) {
        for (const tc of toolCalls) {
          let args: Record<string, any> = {};
          try {
            args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          } catch {
            /* argumentos inválidos */
          }
          const fn = fns.find((f) => f.name === tc.function.name);
          yield { type: 'function', data: { name: tc.function.name, args, status: 'running' } };

          let result: unknown;
          try {
            if (!fn) throw new Error(`Función desconocida: ${tc.function.name}`);
            result = await fn.execute(args);
            await logAction(userId, agent.kind, tc.function.name, args);
          } catch (fnErr) {
            result = { error: fnErr instanceof Error ? fnErr.message : 'Error en la función' };
          }

          yield { type: 'function', data: { name: tc.function.name, args, result } };
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function.name,
            content: JSON.stringify(result),
          });
        }
        continue; // volver a llamar al modelo con los resultados
      }

      break; // finish_reason === 'stop'
    }

    yield { type: 'done', data: { conversationId: convId, usage: { tokens: 0 } } };
  } catch (err) {
    console.error('[chatAI] error general:', err);
    yield {
      type: 'error',
      data: { message: 'Lo siento, no pude completar esa acción.' },
    };
  }
}
