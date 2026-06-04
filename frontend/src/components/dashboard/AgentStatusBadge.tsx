import { cn } from '@/lib/utils';

export function AgentStatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        online ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500',
      )}
    >
      <span
        className={cn('h-2 w-2 rounded-full', online ? 'bg-green-500' : 'bg-slate-400')}
      />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}
