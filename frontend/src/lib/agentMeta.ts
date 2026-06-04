import type { AssistantKind } from '../../../shared/types';

export interface AgentMeta {
  kind: AssistantKind;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  // Clases Tailwind
  bubble: string; // fondo de burbuja del asistente
  header: string; // fondo del header
  badge: string;
  dot: string;
  accentText: string;
}

export const agentMeta: Record<AssistantKind, AgentMeta> = {
  COSMO: {
    kind: 'COSMO',
    name: 'Cosmo',
    emoji: '🟢',
    tagline: '¡Varita mágica!',
    description: 'Divertido, juguetón, creativo. Resuelve lo complejo con brillantez.',
    bubble: 'bg-green-50 border-green-200',
    header: 'bg-green-600',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
    accentText: 'text-green-700',
  },
  WANDA: {
    kind: 'WANDA',
    name: 'Wanda',
    emoji: '🩷',
    tagline: 'Resuelto.',
    description: 'Seria, pragmática, hiper-eficiente. Datos precisos, sin rodeos.',
    bubble: 'bg-pink-50 border-pink-200',
    header: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-800',
    dot: 'bg-pink-400',
    accentText: 'text-pink-700',
  },
};
