'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getDepartmentRequests, updateRequestStatus } from '@/lib/requests';
import { getDepartmentSchedule } from '@/lib/schedules';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: '#fef3c7', color: '#d97706' },
    APPROVED: { bg: '#dcfce7', color: '#16a34a' },
    REJECTED: { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[status] || { bg: '#e8f0fe', color: '#2a4a8c' };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export function HoDApproval() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ['department-requests'],
    queryFn: getDepartmentRequests,
  });

  const { data: deptSlots } = useQuery({
    queryKey: ['department-schedule', user?.departmentId],
    queryFn: () => getDepartmentSchedule(user!.departmentId!),
    enabled: !!user?.departmentId,
  });

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [compScheduleId, setCompScheduleId] = useState('');
  const [compWeek, setCompWeek] = useState('');

  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      updateRequestStatus(id, status, compScheduleId || undefined, compWeek || undefined),
    onMutate: ({ id }) => {
      setErrorRequestId(null); // clear any previous error banner right when a new attempt starts
      setErrorMessage('');
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: ['department-schedule'] });
      setApprovingId(null);
      setCompScheduleId('');
      setCompWeek('');
    },
    onError: (error: any, variables) => {
      const serverMessage = error?.response?.data?.message;
      setErrorRequestId(variables.id);
      setErrorMessage(
        Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : serverMessage || 'This request could not be processed. It may already be resolved, or the schedule slot conflicts with an existing change.',
      );
    },
  });

  const pendingCount = requests?.filter((r: any) => r.status === 'PENDING').length ?? 0;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Georgia', serif", color: '#1a2f5e' }}>Pending Requests</h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a5569' }}>{pendingCount} request{pendingCount === 1 ? '' : 's'} awaiting your decision</p>
        </div>
      </div>

      {isLoading && <p className="text-sm" style={{ color: '#4a5569' }}>Loading requests…</p>}
      {isError && <p className="text-sm" style={{ color: '#dc2626' }}>Could not load requests. Please try again.</p>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl border mb-5" style={{ borderColor: '#dce6f5' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#f0f4f9' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a5569' }}>All Requests</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#f0f4f9' }}>
            {requests?.length ? requests.map((req: any) => (
              <div key={req.id} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#e8f0fe', color: '#1a2f5e' }}>
                    {req.user?.fullName?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: '#1a2f5e' }}>{req.user?.fullName ?? req.user?.email}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: '#f0f4f9', color: '#4a5569' }}>{req.type}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#4a5569' }}>{req.reason || 'No comment provided'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                      Submitted {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => {
                          if (req.type === 'COMPENSATION' && approvingId !== req.id) {
                            setApprovingId(req.id);
                            setCompScheduleId('');
                            setCompWeek('');
                            return;
                          }
                          mutation.mutate({ id: req.id, status: 'APPROVED' });
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: '#22c55e' }}
                      >
                        {req.type === 'COMPENSATION' && approvingId !== req.id ? 'Approve…' : 'Confirm Approve'}
                      </button>
                      <button
                        onClick={() => mutation.mutate({ id: req.id, status: 'REJECTED' })}
                        disabled={mutation.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: '#22c55e' }}>
                        {req.type === 'COMPENSATION' && approvingId !== req.id ? 'Reject…' : 'Confirm Reject'}
                      </button>
                    </div>
                  )}
                </div>

                {req.type === 'COMPENSATION' && approvingId === req.id && (
                  <div className="mt-3 ml-13 p-3 rounded-lg flex items-center gap-2 flex-wrap" style={{ background: '#f8faff' }}>
                    <span className="text-xs font-semibold" style={{ color: '#1a2f5e' }}>Skip which slot?</span>
                    <select
                      value={compScheduleId}
                      onChange={(e) => setCompScheduleId(e.target.value)}
                      className="text-xs px-2 py-1.5 rounded border"
                      style={{ borderColor: '#dce6f5' }}
                    >
                      <option value="">Select a slot</option>
                      {deptSlots?.filter((s: any) => s.userId === req.userId).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.user?.fullName} — {DAY_NAMES[s.dayOfWeek]} {s.startTime}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-semibold" style={{ color: '#1a2f5e' }}>In week of</span>
                    <input
                      type="date"
                      value={compWeek}
                      onChange={(e) => setCompWeek(e.target.value)}
                      className="text-xs px-2 py-1.5 rounded border"
                      style={{ borderColor: '#dce6f5' }}
                    />
                  </div>
                )}
              </div>
            )) : (
              <p className="px-5 py-6 text-sm text-center" style={{ color: '#94a3b8' }}>No requests yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Department schedule grid */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#dce6f5' }}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: '#1a2f5e' }}>Departmental Schedule — This Week</h2>
        {deptSlots?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold pb-3 w-36" style={{ color: '#4a5569' }}>Faculty</th>
                {DAY_NAMES.slice(1, 6).map((d) => (
                  <th key={d} className="text-center text-xs font-semibold pb-3" style={{ color: '#4a5569' }}>{d.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(
                deptSlots.reduce((acc: any, s: any) => {
                  const key = s.userId;
                  if (!acc[key]) acc[key] = { name: s.user?.fullName ?? 'Unknown', days: new Set() };
                  acc[key].days.add(s.dayOfWeek);
                  return acc;
                }, {}),
              ).map((row: any, ri: number) => (
                <tr key={ri} className="border-t" style={{ borderColor: '#f0f4f9' }}>
                  <td className="py-3 text-xs font-medium" style={{ color: '#1a2f5e' }}>{row.name}</td>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <td key={day} className="text-center py-3">
                      {row.days.has(day) ? (
                        <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1a2f5e' }}>✓</div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg mx-auto" style={{ background: '#f0f4f9' }} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm" style={{ color: '#94a3b8' }}>No schedule data for this department yet.</p>
        )}
      </div>
    </div>
  );
}

export default HoDApproval;