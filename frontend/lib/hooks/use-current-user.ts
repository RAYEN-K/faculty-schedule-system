'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../auth';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}