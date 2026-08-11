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
  options?: {
    compensationScheduleId?: string;
    compensationWeekStartDate?: string;
    reviewComment?: string;
  },
) {
  const { data } = await apiClient.patch(`/requests/${id}/status`, {
    status,
    ...(options?.compensationScheduleId && {
      compensationScheduleId: options.compensationScheduleId,
    }),
    ...(options?.compensationWeekStartDate && {
      compensationWeekStartDate: options.compensationWeekStartDate,
    }),
    ...(options?.reviewComment && { reviewComment: options.reviewComment }),
  });
  return data;
}
