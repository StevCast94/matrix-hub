import type { TimelineEventWithProject } from '@/hooks/useTimeline';
import { dayLabel } from '@/lib/utils';
import { TimelineEventItem } from './TimelineEvent';

export function TimelineList({ events }: { events: TimelineEventWithProject[] }) {
  // Agrupar por día preservando el orden (ya viene DESC del backend).
  const groups: { label: string; items: TimelineEventWithProject[] }[] = [];
  for (const ev of events) {
    const label = dayLabel(ev.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(ev);
    else groups.push({ label, items: [ev] });
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.label} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{g.label}</h3>
          <div className="space-y-2">
            {g.items.map((ev) => (
              <TimelineEventItem key={ev.id} event={ev} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
