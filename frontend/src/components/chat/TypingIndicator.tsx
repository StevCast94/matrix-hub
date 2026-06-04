import type { AssistantKind } from '../../../../shared/types';
import { agentMeta } from '@/lib/agentMeta';

export function TypingIndicator({ agent }: { agent: AssistantKind }) {
  const m = agentMeta[agent];
  const verb = agent === 'COSMO' ? 'está escribiendo' : 'está procesando';
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
      <span className="flex gap-1">
        <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${m.dot}`} />
        <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${m.dot} [animation-delay:0.15s]`} />
        <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${m.dot} [animation-delay:0.3s]`} />
      </span>
      {m.name} {verb}…
    </div>
  );
}
