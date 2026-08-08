import { apiClient } from './api-client';

export async function getMyScheduleForWeek(userId: string, weekStartDate: string) {
  const { data } = await apiClient.get(`/schedules/user/${userId}/week/${weekStartDate}`);
  return data;
}
export async function getDepartmentSchedule(departmentId: string) {
  const { data } = await apiClient.get(`/schedules/department/${departmentId}`);
  return data;
}
export async function getMySchedule(userId: string) {
  const todayIso = new Date().toISOString().split('T')[0];
  const { data } = await apiClient.get(`/schedules/user/${userId}/week/${todayIso}`);
  return data;
}