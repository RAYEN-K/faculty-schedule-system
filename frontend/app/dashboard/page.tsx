'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/use-current-user';

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  HOD: '/dashboard/hod/requests',
  FACULTY: '/dashboard/faculty',
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    router.replace(ROLE_HOME[user.role] ?? '/dashboard/faculty');
  }, [user, isLoading, router]);

  return (
    <div className="p-8 text-center text-xs text-slate-400">
      Redirecting to your dashboard…
    </div>
  );
}
