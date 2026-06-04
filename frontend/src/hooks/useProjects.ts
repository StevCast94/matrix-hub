import { useFetch } from './useFetch';
import type { Project } from '../../../shared/types';

interface ProjectWithCounts extends Project {
  _count?: { tasks: number; metrics: number };
}

export function useProjects() {
  return useFetch<{ projects: ProjectWithCounts[] }>('/projects');
}

export function useProject(slug: string | null) {
  return useFetch<{ project: Project & { metrics: unknown[] }; events: unknown[] }>(
    slug ? `/projects/${slug}` : null,
  );
}
