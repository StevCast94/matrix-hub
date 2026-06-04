import type { ChatMessage } from '@/hooks/useChat';
import { agentMeta } from '@/lib/agentMeta';
import { cn, formatTime } from '@/lib/utils';

// Markdown mínimo y seguro: escapa HTML y aplica negritas, code, links y saltos.
function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-200 px-1 text-xs">$1</code>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-sky-600 underline">$1</a>',
    )
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br/>');
}

const fnLabel: Record<string, string> = {
  getMetrics: 'Consultando métricas',
  getTasks: 'Consultando tareas',
  createTask: 'Creando tarea',
  updateTaskStatus: 'Actualizando tarea',
  getProjects: 'Consultando proyectos',
  getMyTasks: 'Consultando tus tareas',
  getAgents: 'Consultando agentes',
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const m = message.agentKind ? agentMeta[message.agentKind] : null;

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
        <span>{isUser ? 'Tú' : `${m?.emoji ?? '🤖'} ${m?.name ?? 'Asistente'}`}</span>
        <span>{formatTime(message.timestamp)}</span>
      </div>

      {/* Function calls */}
      {message.functions && message.functions.length > 0 && (
        <div className="flex max-w-[85%] flex-col gap-1">
          {message.functions.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500"
            >
              {f.result === undefined || f.status === 'running'
                ? `🔍 ${fnLabel[f.name] ?? f.name}…`
                : (f.result as { error?: string })?.error
                  ? `❌ ${fnLabel[f.name] ?? f.name}: ${(f.result as { error: string }).error}`
                  : `✅ ${fnLabel[f.name] ?? f.name}`}
            </div>
          ))}
        </div>
      )}

      {(message.content || !message.functions?.length) && (
        <div
          className={cn(
            'max-w-[85%] rounded-2xl border px-4 py-2 text-sm',
            isUser
              ? 'border-sky-200 bg-sky-500 text-white'
              : cn('text-slate-800', m?.bubble ?? 'border-slate-200 bg-slate-50'),
          )}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
      )}
    </div>
  );
}
