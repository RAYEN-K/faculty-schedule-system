import { apiClient } from './api-client';
import { getStartOfWeekIso } from './date';

export async function getMyScheduleForWeek(userId: string, weekStartDate: string) {
  const { data } = await apiClient.get(`/schedules/user/${userId}/week/${weekStartDate}`);
  return data;
}
export async function getDepartmentScheduleForWeek(
  departmentId: string,
  weekStartDate: string,
) {
  const { data } = await apiClient.get(
    `/schedules/department/${departmentId}/week/${weekStartDate}`,
  );
  return data;
}

export async function getDepartmentSchedule(departmentId: string) {
  const { data } = await apiClient.get(`/schedules/department/${departmentId}`);
  return data;
}
export async function getMySchedule(userId: string) {
  return getMyScheduleForWeek(userId, getStartOfWeekIso());
}

export async function getUserScheduleSlots(userId: string) {
  const { data } = await apiClient.get(`/schedules/user/${userId}`);
  return (data as Array<{ id: string; dayOfWeek: number; startTime: string; endTime: string; weekSpecificOnly?: boolean }>)
    .filter((slot) => !slot.weekSpecificOnly);
}