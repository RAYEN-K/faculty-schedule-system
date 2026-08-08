"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
          {/* LOGO */}
          <div className="flex items-center gap-3 pt-2 px-2">
            <div className="w-9 h-9 bg-[#eab308] rounded-xl flex items-center justify-center font-bold text-[#1b2a4e] shadow-sm">
              FW
            </div>
            <span className="font-bold text-lg tracking-tight">FacultyWork</span>
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
                      ? "bg-[#2b3e6d] text-white shadow-sm font-semibold border-l-4 border-[#eab308]"
                      : "text-slate-300 hover:bg-[#23355d] hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* USER PROFILE & LOGOUT */}
        <div className="border-t border-slate-700/60 pt-4 space-y-3">
          <div className="flex items-center gap-3 bg-[#13203e] p-3 rounded-xl border border-slate-700/40">
            <div className="w-9 h-9 rounded-full bg-[#eab308] text-[#1b2a4e] font-bold flex items-center justify-center text-xs shadow">
              {user?.role ? user.role.slice(0, 2) : "AD"}
            </div>
            <div className="overflow-hidden text-xs">
              <p className="font-semibold text-white truncate">
                {user?.email || "admin@faculty.tn"}
              </p>
              <p className="text-slate-400 text-[11px] capitalize">
                {user?.role?.toLowerCase() || "Faculty Member"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-semibold rounded-lg transition-all border border-red-500/30 cursor-pointer"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE PAGE CONTENT */}
      <div className="pl-64 flex-1 min-h-screen bg-slate-50 text-slate-800">
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}