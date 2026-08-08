"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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

export default function FacultySchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;

        if (user?.id) {
          const res = await apiClient.get(`/schedules/user/${user.id}`);
          setSchedules(Array.isArray(res.data) ? res.data : []);
        } else {
          setSchedules([]);
        }
      } catch (err) {
        console.error(err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

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
        ) : schedules.length === 0 ? (
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