import { apiClient } from './api-client';

export async function getMyRequests() {
  const { data } = await apiClient.get('/requests/my-requests');
  return data;
}

export async function createRequest(payload: {
  type: 'MODIFICATION' | 'ADDITIONAL' | 'COMPENSATION';
  scheduleId?: string;
  originalDate?: string;
  proposedDate?: string;
  reason?: string;
}) {
  const { data } = await apiClient.post('/requests', payload);
  return data;
}
export async function getDepartmentRequests() {
    const { data } = await apiClient.get('/requests/department');
    return data;
}
  
export async function updateRequestStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  compensationScheduleId?: string,
  compensationWeekStartDate?: string,
) {
  const { data } = await apiClient.patch(`/requests/${id}/status`, {
    status,
    ...(compensationScheduleId && { compensationScheduleId }),
    ...(compensationWeekStartDate && { compensationWeekStartDate }),
  });
  return data;
}