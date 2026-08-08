'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, createEvent, deleteEvent } from '@/lib/events';
import { useCurrentUser } from "@/lib/hooks/use-current-user";
interface EventItem {
  id: string;
  title: string;
  eventdate: string;
  description?: string;
}

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // 1. Fetch Events
  const { data: events, isLoading ,isError } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  // 2. Add Event Mutation
  const addMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setTitle('');
      setDescription('');
    },
  });

  // 3. Delete Event Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || !user?.departmentId) return;
    addMutation.mutate({
      title,
      description,
      eventDate: new Date(eventDate).toISOString(),
      departmentId: user.departmentId,
    });
  };
  const [eventDate, setEventDate] = useState('');
  const { data: user } = useCurrentUser();
  if (isLoading) return <p className="p-6">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please try again.</p>;

  return (
    <div className="space-y-8 text-white max-w-3xl">
      {/* Form لإضافة Event */}
      <section className="bg-gray-900 p-6 rounded border border-gray-800">
        <h1 className="text-xl font-bold mb-4 text-blue-400">➕ Add New Department Event</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Event Title (e.g. Faculty Meeting)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white"
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white"
          />
          <textarea
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 font-bold py-2 px-4 rounded"
          >
            {addMutation.isPending ? 'Adding...' : 'Create Event'}
          </button>
        </form>
      </section>

      <section className="bg-gray-900 p-6 rounded border border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-blue-400">🎉 Department Events</h2>
        {isLoading ? (
          <p>Loading events...</p>
        ) : (
          <ul className="space-y-3">
            {events.map((ev: EventItem) => (
              <li
                key={ev.id}
                className="flex justify-between items-center p-3 bg-gray-800 rounded border border-gray-700"
              >
                <div>
                  <h3 className="font-bold text-lg">{ev.title}</h3>
                  <p className="text-sm text-gray-400">{ev.description}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(ev.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}