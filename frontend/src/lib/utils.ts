// Une clases condicionalmente (mini clsx, sin dependencias).
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

/** Fecha corta sin hora: "15 jun 2026". */
export function formatDateShort(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

/** Hora corta: "14:30". */
export function formatTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(d);
}

/** "hace 2h", "hace 5 min", "en 3 días". */
export function relativeTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const past = diffMs < 0;
  const fmt = (n: number, unit: string) => (past ? `hace ${n} ${unit}` : `en ${n} ${unit}`);
  if (mins < 1) return 'ahora';
  if (mins < 60) return fmt(mins, 'min');
  if (hours < 24) return fmt(hours, 'h');
  return fmt(days, days === 1 ? 'día' : 'días');
}

/** Etiqueta de día para agrupar timeline: "Hoy", "Ayer" o fecha. */
export function dayLabel(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Hoy';
  if (same(d, yest)) return 'Ayer';
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}
