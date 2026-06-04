// Rate limit en memoria por usuario (suficiente para 5-10 usuarios).
const requests = new Map<string, number[]>();

const MAX = Number(process.env.RATE_LIMIT_PER_MINUTE) || 10;
const WINDOW_MS = 60_000;

/** Devuelve true si la solicitud está permitida; false si excede el límite. */
export function checkRateLimit(userId: string, maxRequests = MAX, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const recent = (requests.get(userId) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    requests.set(userId, recent);
    return false;
  }

  recent.push(now);
  requests.set(userId, recent);
  return true;
}
