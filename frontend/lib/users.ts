import { apiClient } from './api-client';

export async function getUsers(page: number, pageSize: number) {
  const { data } = await apiClient.get('/users', { params: { page, pageSize } });
  return data;
}

export async function createUser(payload: {
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
}) {
  const { data } = await apiClient.post('/users', payload);
  return data;
}