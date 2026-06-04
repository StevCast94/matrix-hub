import { useCallback, useRef, useState } from 'react';
import { createSSEStream } from '@/lib/sse';
import type { AssistantKind } from '../../../shared/types';

export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status?: 'running';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentKind?: AssistantKind;
  functions?: FunctionCall[];
  timestamp: string;
}

type ChatStatus = 'idle' | 'streaming' | 'error';

export function useChat(initialAgent: AssistantKind) {
  const [agent, setAgent] = useState<AssistantKind>(initialAgent);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const conversationId = useRef<string | undefined>(undefined);

  const switchAgent = useCallback((next: AssistantKind) => {
    setAgent(next);
    setMessages([]);
    conversationId.current = undefined;
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    conversationId.current = undefined;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || status === 'streaming') return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      const assistantId = crypto.randomUUID();
      setMessages((m) => [
        ...m,
        userMsg,
        { id: assistantId, role: 'assistant', content: '', agentKind: agent, functions: [], timestamp: new Date().toISOString() },
      ]);
      setStatus('streaming');

      const patch = (fn: (msg: ChatMessage) => ChatMessage) =>
        setMessages((m) => m.map((msg) => (msg.id === assistantId ? fn(msg) : msg)));

      try {
        const { stream } = createSSEStream('/chat/send', {
          message: text,
          agentId: agent,
          conversationId: conversationId.current,
        });

        for await (const event of stream()) {
          if (event.type === 'token') {
            patch((msg) => ({ ...msg, content: msg.content + (event.data as string) }));
          } else if (event.type === 'function') {
            const fc = event.data as FunctionCall;
            patch((msg) => {
              const fns = [...(msg.functions ?? [])];
              const existing = fns.findIndex((f) => f.name === fc.name && f.status === 'running');
              if (fc.status === 'running') fns.push(fc);
              else if (existing >= 0) fns[existing] = fc;
              else fns.push(fc);
              return { ...msg, functions: fns };
            });
          } else if (event.type === 'done') {
            const d = event.data as { conversationId: string };
            conversationId.current = d.conversationId;
            setStatus('idle');
          } else if (event.type === 'error') {
            const d = event.data as { message: string };
            patch((msg) => ({ ...msg, content: msg.content || `⚠️ ${d.message}` }));
            setStatus('error');
          }
        }
        setStatus((s) => (s === 'streaming' ? 'idle' : s));
      } catch (err) {
        patch((msg) => ({
          ...msg,
          content: msg.content || `⚠️ ${err instanceof Error ? err.message : 'Error de conexión'}`,
        }));
        setStatus('error');
      }
    },
    [agent, status],
  );

  return { agent, messages, status, sendMessage, switchAgent, clearConversation };
}
