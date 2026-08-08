'use client';
import { useRequireRole } from '@/lib/hooks/use-require-role';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireRole(['FACULTY', 'HOD', 'ADMIN']);
  if (isLoading) return <div className="p-8 font-medium">Loading...</div>;
  return <>{children}</>;
}