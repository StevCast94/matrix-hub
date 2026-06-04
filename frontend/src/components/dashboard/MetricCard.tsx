import type { Metric } from '../../../../shared/types';
import { formatMetricValue } from '@/lib/formatMetric';
import { StaleBadge } from './StaleBadge';

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-xs font-medium text-slate-500">{metric.label ?? metric.key}</span>
      <span className="font-mono text-2xl font-semibold text-slate-900">
        {formatMetricValue(metric.value, metric.format)}
      </span>
      <StaleBadge verifiedAt={metric.verifiedAt} isStale={metric.isStale} />
    </div>
  );
}
