'use client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getDepartmentSchedule } from '@/lib/schedules';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Only weekdays are shown as sections — adjust if your institution works weekends
const WORK_DAYS = [1, 2, 3, 4, 5];

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string | null;
  user?: { fullName?: string; email?: string };
}

export default function DepartmentSchedulePage() {
  const { data: user } = useCurrentUser();
  const { data: slots, isLoading, isError } = useQuery({
    queryKey: ['department-schedule', user?.departmentId],
    queryFn: () => getDepartmentSchedule(user!.departmentId!),
    enabled: !!user?.departmentId,
  });

  if (isLoading) return <p className="p-6 text-slate-500">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please try again.</p>;

  const slotsByDay = WORK_DAYS.map((day) => ({
    day,
    slots: (slots ?? [])
      .filter((s: ScheduleSlot) => s.dayOfWeek === day)
      .sort((a: ScheduleSlot, b: ScheduleSlot) => a.startTime.localeCompare(b.startTime)),
  }));

  const hasAnySlots = slotsByDay.some((d) => d.slots.length > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Department Weekly Schedule</h1>
      <p className="text-sm text-slate-500 mb-6">All faculty sessions this week, grouped by day</p>

      {!hasAnySlots && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          No scheduled sessions found for this department yet.
        </div>
      )}

      <div className="space-y-6">
        {slotsByDay.map(({ day, slots: daySlots }) =>
          daySlots.length === 0 ? null : (
            <div key={day}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                {DAYS[day]}
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {daySlots.map((slot: ScheduleSlot) => (
                  <div key={slot.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {slot.subject || 'Untitled Session'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {slot.user?.fullName ?? slot.user?.email ?? 'Unassigned'}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap ml-4">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}