'use client';
import { useRequireRole } from '@/lib/hooks/use-require-role';

export default function HodLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireRole(['HOD', 'ADMIN']);
  if (isLoading) return <div className="p-8 font-medium">Loading...</div>;
  return <>{children}</>;
}