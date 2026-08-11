'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getDepartmentScheduleForWeek } from '@/lib/schedules';
import { getStartOfWeekIso } from '@/lib/date';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GRID_DAYS = [1, 2, 3, 4, 5];
const PAGE_SIZE = 8;

interface WeekSlot {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject?: string | null;
  isException?: boolean;
  user?: { fullName?: string; email?: string };
}

export default function DepartmentSchedulePage() {
  const { data: user } = useCurrentUser();
  const weekStart = getStartOfWeekIso();
  const departmentId = user?.departmentId;

  const { data: slots, isLoading, isError } = useQuery({
    queryKey: ['department-schedule-week', departmentId, weekStart],
    queryFn: () => getDepartmentScheduleForWeek(departmentId!, weekStart),
    enabled: !!departmentId,
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const facultyRows = useMemo(() => {
    const map = new Map<string, {
      name: string;
      days: Map<number, WeekSlot[]>;
    }>();

    for (const slot of (slots ?? []) as WeekSlot[]) {
      const key = slot.userId;
      if (!map.has(key)) {
        map.set(key, {
          name: slot.user?.fullName ?? slot.user?.email ?? 'Unknown',
          days: new Map(),
        });
      }
      const row = map.get(key)!;
      const daySlots = row.days.get(slot.dayOfWeek) ?? [];
      daySlots.push(slot);
      row.days.set(slot.dayOfWeek, daySlots);
    }

    return Array.from(map.entries()).map(([userId, row]) => ({ userId, ...row }));
  }, [slots]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return facultyRows;
    return facultyRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [facultyRows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!departmentId) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-2xl mb-3">🏢</p>
        <h1 className="text-lg font-bold text-slate-900 mb-2">No Department Assigned</h1>
        <p className="text-sm text-slate-500">
          Link your HoD account to a department to view the schedule grid.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Departmental Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">This week&apos;s working days for all faculty (includes approved changes)</p>
        </div>
        <input
          type="text"
          placeholder="Search faculty name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading schedule…</p>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-red-500">Could not load schedule.</p>
        ) : paginated.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No faculty schedules match your search.</p>
        ) : (
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-40">
                    Faculty
                  </th>
                  {GRID_DAYS.map((d) => (
                    <th key={d} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-3">
                      {DAY_NAMES[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((row) => (
                  <tr key={row.userId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-800">{row.name}</td>
                    {GRID_DAYS.map((day) => {
                      const daySlots = row.days.get(day) ?? [];
                      return (
                        <td key={day} className="text-center px-2 py-3">
                          {daySlots.length > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              {daySlots.map((s) => (
                                <div
                                  key={s.id}
                                  title={`${s.startTime}–${s.endTime}${s.isException ? ' (modified)' : ''}`}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${
                                    s.isException ? 'bg-amber-500' : 'bg-[#1a2f5e]'
                                  }`}
                                >
                                  ✓
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg mx-auto bg-slate-100" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} · {filtered.length} faculty
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
