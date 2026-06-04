import { useFetch } from './useFetch';
import type { ProjectWithMetrics } from '../../../shared/types';

export function useMetrics() {
  return useFetch<{ projects: ProjectWithMetrics[] }>('/metrics');
}
