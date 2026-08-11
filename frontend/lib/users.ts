import { apiClient } from './api-client';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export async function getUsers(page: number, pageSize: number): Promise<PaginatedResponse<UserRecord>> {
  const { data } = await apiClient.get('/users', { params: { page, pageSize } });
  return data;
}

export async function getUser(id: string): Promise<UserRecord> {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
}

export async function createUser(payload: {
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  departmentId?: string;
}) {
  const { data } = await apiClient.post('/users', payload);
  return data;
}

export async function updateUser(
  id: string,
  payload: {
    email?: string;
    password?: string;
    fullName?: string;
    role?: 'ADMIN' | 'HOD' | 'FACULTY';
    departmentId?: string | null;
  },
) {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string) {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
}
