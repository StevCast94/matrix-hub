import { supabase } from './supabase';

/**
 * Wrapper de fetch que adjunta el JWT de Supabase y apunta a /api.
 */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const res = await fetch(`/api${path}`, { ...init, headers });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
