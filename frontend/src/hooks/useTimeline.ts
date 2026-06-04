import { useFetch } from './useFetch';
import type { TimelineEvent } from '../../../shared/types';

interface TimelineFilters {
  type?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export interface TimelineEventWithProject extends TimelineEvent {
  project?: { name: string; slug: string } | null;
}

export function useTimeline(filters: TimelineFilters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.projectId) params.set('projectId', filters.projectId);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return useFetch<{ events: TimelineEventWithProject[]; hasMore: boolean; total?: number }>(
    `/timeline${qs ? `?${qs}` : ''}`,
  );
}
