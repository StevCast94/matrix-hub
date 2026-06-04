import { useAgents } from '@/hooks/useAgents';
import { AgentStatusBadge } from '@/components/dashboard/AgentStatusBadge';
import { Card, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils';

export default function AgentsPage() {
  const { data, loading, error } = useAgents();
  const agents = data?.agents ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">🤖 Agentes</h1>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <EmptyState icon="❌" title="Error" description={error} />
      ) : agents.length === 0 ? (
        <EmptyState icon="🤖" title="Sin agentes" description="No hay agentes registrados." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{a.displayName}</p>
                    <p className="text-xs text-slate-400">{a.kind}</p>
                  </div>
                </div>
                <AgentStatusBadge online={a.online} />
              </div>
              <p className="text-xs text-slate-500">
                Último heartbeat:{' '}
                {a.lastHeartbeat ? formatDate(a.lastHeartbeat) : 'nunca'}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
