import { useFetch } from './useFetch';
import type { Task } from '../../../shared/types';

export function useNotifications() {
  return useFetch<{ tasks: Task[] }>('/notifications');
}

export function useNotificationCount() {
  return useFetch<{ count: number }>('/notifications/count');
}
