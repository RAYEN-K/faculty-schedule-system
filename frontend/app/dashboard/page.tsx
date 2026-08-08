"use client";

import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export default function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading user data...
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            My Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.email || "admin@faculty.tn"}</span>
          </p>
        </div>
        <Link
          href="/dashboard/faculty/requests"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#1b2a4e] text-white text-xs font-semibold rounded-lg hover:bg-[#152240] transition-colors shadow-sm self-start sm:self-auto"
        >
          + New Request
        </Link>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Working Days / Week
          </p>
          <p className="text-3xl font-bold text-slate-900">0</p>
          <p className="text-[11px] text-slate-400">—</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pending Requests
          </p>
          <p className="text-3xl font-bold text-amber-500">0</p>
          <p className="text-[11px] text-slate-400">Awaiting approval</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Approved This Month
          </p>
          <p className="text-3xl font-bold text-emerald-600">0</p>
          <p className="text-[11px] text-slate-400">Successfully approved</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Events This Week
          </p>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-[11px] text-slate-400">Active department events</p>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">
            This Week's Schedule
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <div
                key={day}
                className="p-3 bg-slate-50 rounded-lg text-center border border-slate-100 text-xs font-medium text-slate-600"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Recent Requests</h2>
            <Link
              href="/dashboard/faculty/requests"
              className="text-xs text-[#1b2a4e] font-semibold hover:underline"
            >
              View All
            </Link>
          </div>
          <p className="text-xs text-slate-400">No recent requests.</p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Upcoming Events</h2>
          <Link
            href="/dashboard/faculty/events"
            className="text-xs text-[#1b2a4e] font-semibold hover:underline"
          >
            View All Events
          </Link>
        </div>
        <p className="text-xs text-slate-400">No upcoming events scheduled.</p>
      </div>
    </div>
  );
}