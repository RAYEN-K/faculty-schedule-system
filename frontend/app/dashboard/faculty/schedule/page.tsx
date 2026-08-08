"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { getMyScheduleForWeek } from "@/lib/schedules";

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isException?: boolean;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function weekAnchorIso(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export default function FacultySchedulePage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();

  const {
    data: schedules,
    isLoading: scheduleLoading,
    isError,
  } = useQuery({
    queryKey: ["my-schedule-week", user?.id],
    queryFn: () =>
      getMyScheduleForWeek(user!.id, weekAnchorIso()) as Promise<ScheduleSlot[]>,
    enabled: !!user?.id,
  });

  const loading = userLoading || scheduleLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">
          My Schedule (This Week)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your current assigned teaching slots and weekly timetable.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading schedule...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-500">
            Could not load your schedule. Please try again.
          </div>
        ) : !schedules?.length ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No schedule slots found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3">Day</th>
                <th className="px-6 py-3">Start Time</th>
                <th className="px-6 py-3">End Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {schedules.map((slot) => (
                <tr
                  key={slot.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {DAYS[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`}
                    {slot.isException && (
                      <span className="ml-2 text-[10px] font-normal text-amber-600">
                        (modified)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono">
                    {slot.startTime}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono">
                    {slot.endTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
