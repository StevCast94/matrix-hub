import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/hooks/useChat';
import type { AssistantKind } from '../../../../shared/types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { WelcomeMessage } from './WelcomeMessage';

interface Props {
  agent: AssistantKind;
  messages: ChatMessage[];
  streaming: boolean;
  onSend: (text: string) => void;
}

export function ChatWindow({ agent, messages, streaming, onSend }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Mostrar typing solo si el último mensaje del asistente aún no tiene contenido.
  const last = messages[messages.length - 1];
  const showTyping = streaming && last?.role === 'assistant' && !last.content;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <WelcomeMessage agent={agent} />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {showTyping && <TypingIndicator agent={agent} />}
        <div ref={endRef} />
      </div>
      <ChatInput onSend={onSend} disabled={streaming} />
    </div>
  );
}
