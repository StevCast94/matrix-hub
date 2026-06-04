import { supabase } from './supabase';

export interface SSEMessage {
  type: 'token' | 'function' | 'done' | 'error';
  data: unknown;
}

export interface SSEHandle {
  stream: () => AsyncGenerator<SSEMessage>;
  cancel: () => void;
}

/**
 * POST + lectura de stream SSE (EventSource nativo solo soporta GET).
 * Adjunta el JWT de Supabase automáticamente.
 */
export function createSSEStream(path: string, body: unknown): SSEHandle {
  const controller = new AbortController();

  async function* stream(): AsyncGenerator<SSEMessage> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      let message = `Error ${res.status}`;
      try {
        const j = await res.json();
        message = j.error ?? message;
      } catch {
        /* sin JSON */
      }
      yield { type: 'error', data: { message } };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent: SSEMessage['type'] = 'token';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim() as SSEMessage['type'];
        } else if (line.startsWith('data:')) {
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            yield { type: currentEvent, data: JSON.parse(raw) };
          } catch {
            /* fragmento parcial */
          }
        }
      }
    }
  }

  return { stream, cancel: () => controller.abort() };
}
