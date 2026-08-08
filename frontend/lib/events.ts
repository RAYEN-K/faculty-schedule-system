import { apiClient } from './api-client';


export async function getEvents() {
  const { data } = await apiClient.get('/events');
  return data;
}


export async function createEvent(payload: {
  title: string;
  description?: string;
  eventDate: string;
  departmentId: string;
}) {
  const { data } = await apiClient.post('/events', payload);
  return data;
}

export async function deleteEvent(id: string) {
  const { data } = await apiClient.delete(`/events/${id}`);
  return data;
}