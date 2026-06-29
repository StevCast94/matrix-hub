import { getToken } from './token';

/**
 * Wrapper de fetch que adjunta el JWT propio (auth self-hosted) y apunta a /api.
 */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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
