'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getDepartmentRequests, updateRequestStatus } from '@/lib/requests';
import { getUserScheduleSlots } from '@/lib/schedules';
import { getStartOfWeekIso } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/api-error';

type StatusTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
const PAGE_SIZE = 8;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
      {type}
    </span>
  );
}

export function HoDApproval() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ['department-requests'],
    queryFn: getDepartmentRequests,
    enabled: user?.role === 'HOD' || user?.role === 'ADMIN',
  });

  const [activeTab, setActiveTab] = useState<StatusTab>('PENDING');
  const [page, setPage] = useState(1);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [compScheduleId, setCompScheduleId] = useState('');
  const [compWeek, setCompWeek] = useState('');
  const [compUserId, setCompUserId] = useState<string | null>(null);

  const { data: compUserSlots } = useQuery({
    queryKey: ['compensation-slots', compUserId],
    queryFn: () => getUserScheduleSlots(compUserId!),
    enabled: !!compUserId,
  });

  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
      reviewComment,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
      reviewComment?: string;
    }) =>
      updateRequestStatus(id, status, {
        compensationScheduleId: compScheduleId || undefined,
        compensationWeekStartDate: compWeek || undefined,
        reviewComment,
      }),
    onMutate: async ({ id, status, reviewComment }) => {
      setErrorRequestId(null);
      setErrorMessage('');
      await queryClient.cancelQueries({ queryKey: ['department-requests'] });
      const previous = queryClient.getQueryData<any[]>(['department-requests']);
      queryClient.setQueryData(['department-requests'], (old: any[] | undefined) =>
        (old ?? []).map((r) =>
          r.id === id ? { ...r, status, reviewComment: reviewComment ?? r.reviewComment } : r,
        ),
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: ['department-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule-week'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule-list'] });
      setApprovingId(null);
      setRejectingId(null);
      setRejectReason('');
      setCompScheduleId('');
      setCompWeek('');
      setCompUserId(null);
    },
    onError: (error: any, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['department-requests'], context.previous);
      }
      setErrorRequestId(variables.id);
      setErrorMessage(
        getApiErrorMessage(error, 'This request could not be processed.'),
      );
    },
  });

  const requestList = requests ?? [];
  const pendingCount = requestList.filter((r: any) => r.status === 'PENDING').length;
  const approvedCount = requestList.filter((r: any) => r.status === 'APPROVED').length;
  const rejectedCount = requestList.filter((r: any) => r.status === 'REJECTED').length;

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return requestList;
    return requestList.filter((r: any) => r.status === activeTab);
  }, [requestList, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs: { id: StatusTab; label: string; count: number }[] = [
    { id: 'PENDING', label: 'Pending', count: pendingCount },
    { id: 'APPROVED', label: 'Approved', count: approvedCount },
    { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
    { id: 'ALL', label: 'All Requests', count: requestList.length },
  ];

  function switchTab(tab: StatusTab) {
    setActiveTab(tab);
    setPage(1);
    setApprovingId(null);
    setRejectingId(null);
  }

  function handleApprove(req: any) {
    if (req.type === 'COMPENSATION' && approvingId !== req.id) {
      setApprovingId(req.id);
      setCompUserId(req.userId);
      setCompScheduleId('');
      setCompWeek(getStartOfWeekIso());
      setErrorRequestId(null);
      setErrorMessage('');
      return;
    }
    mutation.mutate({ id: req.id, status: 'APPROVED' });
  }

  function handleReject(req: any) {
    if (rejectingId !== req.id) {
      setRejectingId(req.id);
      setRejectReason('');
      return;
    }
    if (rejectReason.trim().length < 3) return;
    mutation.mutate({
      id: req.id,
      status: 'REJECTED',
      reviewComment: rejectReason.trim(),
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">Faculty Requests</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, approve, or reject schedule change requests from your faculty.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === tab.id ? 'bg-slate-700' : 'bg-slate-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading requests…</p>}
      {isError && <p className="text-sm text-red-600">Could not load requests. Please try again.</p>}

      {!isLoading && !isError && (
        <>
          <div className="space-y-3">
            {paginated.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
                No {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} requests found.
              </div>
            ) : (
              paginated.map((req: any) => (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                    req.status === 'PENDING'
                      ? 'border-amber-200 ring-1 ring-amber-100'
                      : req.status === 'REJECTED'
                      ? 'border-red-100'
                      : 'border-slate-200'
                  }`}
                >
                  {errorRequestId === req.id && errorMessage && (
                    <div className="mb-3 px-3 py-2 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {req.user?.fullName?.slice(0, 2).toUpperCase() ?? '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {req.user?.fullName ?? req.user?.email}
                        </span>
                        <TypeBadge type={req.type} />
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-slate-600">{req.reason || 'No comment provided'}</p>
                      {req.proposedDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          Target: {new Date(req.proposedDate).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric',
                          })}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        Submitted {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                      {req.status === 'REJECTED' && req.reviewComment && (
                        <div className="mt-2 px-3 py-2 rounded-lg text-xs bg-red-50 text-red-700 border border-red-100">
                          <span className="font-semibold">HoD feedback:</span> {req.reviewComment}
                        </div>
                      )}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={mutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          disabled={mutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {req.type === 'COMPENSATION' && approvingId === req.id && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                      <p className="text-xs text-slate-600">
                        Choose which regular slot to skip and in which week. The faculty member&apos;s extra day ({req.proposedDate ? new Date(req.proposedDate).toLocaleDateString() : 'proposed date'}) will be added after approval.
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Skip slot</label>
                        <select
                          value={compScheduleId}
                          onChange={(e) => setCompScheduleId(e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="">Select a slot</option>
                          {(compUserSlots ?? []).map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">In week of</label>
                        <input
                          type="date"
                          value={compWeek}
                          onChange={(e) => setCompWeek(e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg border border-slate-200"
                        />
                      </div>
                      <button
                        onClick={() => mutation.mutate({ id: req.id, status: 'APPROVED' })}
                        disabled={mutation.isPending || !compScheduleId || !compWeek}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 disabled:opacity-50"
                      >
                        Confirm Approve
                      </button>
                      <button
                        onClick={() => { setApprovingId(null); setCompUserId(null); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600"
                      >
                        Cancel
                      </button>
                      </div>
                    </div>
                  )}

                  {rejectingId === req.id && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 space-y-2">
                      <label className="block text-xs font-semibold text-red-800">Rejection reason (required)</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        placeholder="Explain why this request is rejected…"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-red-200 bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(req)}
                          disabled={mutation.isPending || rejectReason.trim().length < 3}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 disabled:opacity-50"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} · {filtered.length} request{filtered.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HoDApproval;
