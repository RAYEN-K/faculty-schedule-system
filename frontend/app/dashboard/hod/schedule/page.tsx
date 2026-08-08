'use client';
import { useQuery  } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getDepartmentSchedule } from '@/lib/schedules';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  user?:{fullName?: string; email?:string;};
}


export default function DepartmentSchedulePage() {
  const { data: user } = useCurrentUser();
  const { data: slots, isLoading ,isError} = useQuery({
    queryKey: ['department-schedule', user?.departmentId],
    queryFn: () => getDepartmentSchedule(user!.departmentId!),enabled: !!user?.departmentId,});
  

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please
  try again.</p>;

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4 text-blue-400">📅 Department Weekly Schedule</h1>
      
      <div className="grid grid-cols-1 gap-3">
        {slots?.map((slot: ScheduleSlot) => (
          <div key={slot.id} className="p-3 bg-gray-900 border border-gray-800 rounded">
            <p className="font-bold text-lg">{slot.subject || 'Lecture'}</p>
            <p className="text-sm text-gray-400">
              Professor: {slot.user?.fullName || 'N/A'} | Day: {DAYS[slot.dayOfWeek]}
            </p>
            <p className="text-xs text-gray-500">
              {slot.startTime} - {slot.endTime}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}