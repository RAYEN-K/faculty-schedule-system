'use client';
import { useRequireRole } from '@/lib/hooks/use-require-role';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireRole(['ADMIN']);
  if (isLoading) return <div className="p-8 font-medium">Loading...</div>;
  return <>{children}</>;
}