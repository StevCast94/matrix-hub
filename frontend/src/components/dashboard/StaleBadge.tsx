import { cn } from '@/lib/utils';
import { getStaleStatus, type StaleVariant } from '@/lib/formatMetric';

const styles: Record<StaleVariant, string> = {
  fresh: 'text-green-600 bg-green-50',
  aging: 'text-amber-600 bg-amber-50',
  stale: 'text-red-600 bg-red-50',
};

const icons: Record<StaleVariant, string> = {
  fresh: '✅',
  aging: '🟡',
  stale: '⚠️',
};

export function StaleBadge({ verifiedAt, isStale }: { verifiedAt: string; isStale?: boolean }) {
  const status = getStaleStatus(verifiedAt, isStale);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        styles[status.variant],
      )}
    >
      <span>{icons[status.variant]}</span>
      {status.label}
    </span>
  );
}
