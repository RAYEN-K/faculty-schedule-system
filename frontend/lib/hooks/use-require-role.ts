'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from './use-current-user';

export function useRequireRole(allowedRoles: string[]) {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [isLoading, user, allowedRoles, router]);

  return { user, isLoading };
}