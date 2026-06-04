import type { AssistantKind } from '../../../../shared/types';
import { agentMeta } from '@/lib/agentMeta';

const welcome: Record<AssistantKind, string> = {
  COSMO: '¡Hola! Soy Cosmo, tu asistente mágico. ✨ Pregúntame por métricas, tareas o proyectos. ¡Yo puedo con eso! 🪄',
  WANDA: 'Soy Wanda. Dime qué necesitas: métricas, tareas o proyectos. Respuestas precisas, sin rodeos.',
};

export function WelcomeMessage({ agent }: { agent: AssistantKind }) {
  const m = agentMeta[agent];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="text-5xl">{m.emoji}</div>
      <p className={`text-lg font-semibold ${m.accentText}`}>{m.name}</p>
      <p className="max-w-sm text-sm text-slate-500">{welcome[agent]}</p>
    </div>
  );
}
