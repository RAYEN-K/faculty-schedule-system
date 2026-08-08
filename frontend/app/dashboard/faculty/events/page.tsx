'use client';

import { useQuery } from '@tanstack/react-query';
import { getEvents } from '@/lib/events';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  eventdate: string;
}

export default function FacultyEventsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  if (isLoading) return <p className="p-6">Loading events...</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Department Events</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {events?.map((event: EventItem) => (
          <div key={event.id} className="border p-4 rounded-lg shadow-sm bg-white">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <p className="text-sm text-gray-500">{new Date(event.eventdate).toLocaleDateString()}</p>
            {event.description && <p className="mt-2 text-gray-700">{event.description}</p>}
          </div>
        ))}
        {events?.length === 0 && <p className="text-gray-500">No events scheduled.</p>}
      </div>
    </div>
  );
}