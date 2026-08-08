'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../auth';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false, // no point retrying an invalid/expired token
  });
}