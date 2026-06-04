import { useState } from 'react';
import { useTimeline } from '@/hooks/useTimeline';
import { TimelineList } from '@/components/timeline/TimelineList';
import { TimelineFilters } from '@/components/timeline/TimelineFilters';
import { Button, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';

export default function TimelinePage() {
  const [filters, setFilters] = useState<{ type?: string; projectId?: string }>({});
  const [limit, setLimit] = useState(50);
  const { data, loading, error } = useTimeline({ ...filters, limit });
  const events = data?.events ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">📜 Timeline</h1>
      </div>

      <TimelineFilters
        type={filters.type}
        projectId={filters.projectId}
        onChange={(next) => {
          setFilters(next);
          setLimit(50);
        }}
      />

      {loading && events.length === 0 ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <EmptyState icon="❌" title="Error" description={error} />
      ) : events.length === 0 ? (
        <EmptyState icon="📭" title="Sin eventos" description="No hay eventos para los filtros." />
      ) : (
        <>
          <TimelineList events={events} />
          {data?.hasMore && (
            <div className="text-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + 50)}>
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
