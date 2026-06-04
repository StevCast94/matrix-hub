import type { TimelineEventWithProject } from '@/hooks/useTimeline';
import { formatTime } from '@/lib/utils';

const typeIcon: Record<string, string> = {
  deploy: '🚀',
  health_check: '❤️',
  metric_sync: '✅',
  task_created: '📋',
  task_status_change: '🔄',
  task_done: '✔️',
  task_assigned: '👤',
  agent_online: '🤖',
  ai_action: '✨',
  project_created: '📁',
};

export function TimelineEventItem({ event }: { event: TimelineEventWithProject }) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-lg">{typeIcon[event.type] ?? '•'}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-slate-800">{event.title}</p>
          <span className="shrink-0 text-xs text-slate-400">{formatTime(event.createdAt)}</span>
        </div>
        <p className="text-xs text-slate-500">
          {event.actorType === 'cron' ? 'Sistema' : event.actorType}
          {event.project && ` · ${event.project.name}`}
          {event.body && ` · ${event.body}`}
        </p>
      </div>
    </div>
  );
}
