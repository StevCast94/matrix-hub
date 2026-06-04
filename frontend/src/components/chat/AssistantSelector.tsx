import type { AssistantKind } from '../../../../shared/types';
import { agentMeta } from '@/lib/agentMeta';
import { cn } from '@/lib/utils';

interface Props {
  selected: AssistantKind;
  onSelect: (kind: AssistantKind) => void;
}

export function AssistantSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['COSMO', 'WANDA'] as AssistantKind[]).map((kind) => {
        const m = agentMeta[kind];
        const active = selected === kind;
        return (
          <button
            key={kind}
            onClick={() => onSelect(kind)}
            className={cn(
              'rounded-xl border p-3 text-left transition',
              active ? `${m.bubble} ring-2 ring-offset-1` : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{m.emoji}</span>
              <span className="font-semibold text-slate-900">{m.name}</span>
              <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium', m.badge)}>
                {m.tagline}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{m.description}</p>
          </button>
        );
      })}
    </div>
  );
}
