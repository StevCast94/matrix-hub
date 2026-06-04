import { useFetch } from './useFetch';
import type { AgentStatus } from '../../../shared/types';

export function useAgents() {
  return useFetch<{ agents: AgentStatus[] }>('/agents');
}
