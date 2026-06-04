import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { AssistantSelector } from '@/components/chat/AssistantSelector';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { agentMeta } from '@/lib/agentMeta';

export default function ChatPage() {
  const { user } = useAuth();
  const initial = user?.aiAssistant ?? 'COSMO';
  const { agent, messages, status, sendMessage, switchAgent } = useChat(initial);
  const m = agentMeta[agent];

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      <h1 className="text-2xl font-semibold text-slate-900">💬 Asistente IA</h1>

      <AssistantSelector selected={agent} onSelect={switchAgent} />

      <div className="min-h-0 flex-1">
        <ChatWindow
          agent={agent}
          messages={messages}
          streaming={status === 'streaming'}
          onSend={sendMessage}
        />
      </div>

      <p className={`text-center text-xs text-slate-400`}>
        ⚡ {m.name} puede: consultar métricas · gestionar tareas · ver proyectos · responder preguntas
      </p>
    </div>
  );
}
