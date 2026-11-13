import type { AdminAnalytics } from '@mindbridge/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export const useAnalytics = () =>
  useQuery({ queryKey: ['analytics'], queryFn: () => api<AdminAnalytics>('/admin/analytics'), refetchInterval: 60_000 });
