import { apiClient } from './api-client';

export async function updateDepartment(id: string, payload: { name?: string; code?: string }) {
  const { data } = await apiClient.patch(`/departments/${id}`, payload);
  return data;
}

export async function getDepartments() {
  const { data } = await apiClient.get('/departments');
  return data;
}

export async function createDepartment(payload: { name: string; code: string }) {
  const { data } = await apiClient.post('/departments', payload);
  return data;
}

export async function assignUserToDepartment(userId: string, departmentId: string) {
  const { data } = await apiClient.post('/departments/assign-user', { userId, departmentId });
  return data;
}
