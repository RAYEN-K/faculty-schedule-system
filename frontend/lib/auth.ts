import { apiClient } from './api-client';

export interface LoginResponse {
  access_token: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  departmentId: string | null;
}

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  localStorage.setItem('token', data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<CurrentUser>('/auth/me');
  return data;
}