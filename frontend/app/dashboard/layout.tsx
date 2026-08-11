"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/use-current-user';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    window.location.href = '/login';
  };

  const NAV_ITEMS_BY_ROLE: Record<string, { label: string; href: string; icon: string }[]> = {
    ADMIN: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
      { label: 'Departments', href: '/dashboard/admin/departments', icon: '🏢' },
      { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
      { label: 'Assignments', href: '/dashboard/admin/assignments', icon: '🔗' },
    ],
    HOD: [
      { label: 'Requests', href: '/dashboard/hod/requests', icon: '📋' },
      { label: 'Department Schedule', href: '/dashboard/hod/schedule', icon: '🗓️' },
      { label: 'Events', href: '/dashboard/hod/events', icon: '📌' },
    ],
    FACULTY: [
      { label: 'Dashboard', href: '/dashboard/faculty', icon: '📊' },
      { label: 'My Schedule', href: '/dashboard/faculty/schedule', icon: '🗓️' },
      { label: 'Requests', href: '/dashboard/faculty/requests', icon: '📋' },
      { label: 'Events', href: '/dashboard/faculty/events', icon: '📌' },
    ],
  };

  const navItems = user ? NAV_ITEMS_BY_ROLE[user.role] ?? [] : [];

  if (isLoading) {
    return <div className="p-8 font-medium">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* FIXED SIDEBAR ON THE LEFT */}
      <aside className="w-64 bg-[#1b2a4e] text-white flex flex-col justify-between p-5 h-screen fixed left-0 top-0 bottom-0 z-50 shadow-lg">
        <div className="space-y-8">
          {/* IIT BRANDING LOGO HEADER */}
          <div className="flex items-center gap-3 pt-2 px-2 pb-4 border-b border-[#2b3e6d]">
            <div className="bg-white p-1.5 rounded-xl shadow-sm flex items-center justify-center shrink-0">
              <img
                src="/iit-logo.png"
                alt="IIT Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-tight">
                IIT Sfax
              </span>
              <span className="text-[11px] text-[#eab308] font-semibold">
                FacultyWork
              </span>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#2b3e6d] text-white shadow-sm font-semibold border-l-4 border-[#eab308]'
                      : 'text-slate-300 hover:bg-[#23355d] hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* LOGOUT BUTTON AT THE BOTTOM */}
        <div className="pt-4 border-t border-[#2b3e6d]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-red-600/90 hover:bg-red-600 text-white font-medium text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8 bg-slate-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}