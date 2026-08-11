'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getMySchedule } from '@/lib/schedules';
import { createRequest, getMyRequests } from '@/lib/requests';
import { getApiErrorMessage } from '@/lib/api-error';
import { dateForDayInWeek, getStartOfWeekIso, isSameWeek } from '@/lib/date';

const REQUEST_TYPES = [
  { id: 'MODIFICATION', icon: '🔄', title: 'Working Day Swap', desc: 'Replace a scheduled day with another day in the same week' },
  { id: 'ADDITIONAL', icon: '➕', title: 'Additional Working Day', desc: 'Work an extra day this week beyond your schedule' },
  { id: 'COMPENSATION', icon: '⚖️', title: 'Compensation Arrangement', desc: 'Work extra now, offset by fewer days in a future week' },
] as const;

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

export function ScheduleRequest() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: mySlots } = useQuery({
    queryKey: ['my-schedule-list', user?.id],
    queryFn: () => getMySchedule(user!.id),
    enabled: !!user,
  });

  const { data: myRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: getMyRequests,
  });

  const [selectedType, setSelectedType] = useState<(typeof REQUEST_TYPES)[number]['id']>('MODIFICATION');
  const [scheduleId, setScheduleId] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule-week'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule-list'] });
      setSubmitted(true);
      setScheduleId('');
      setProposedDate('');
      setReason('');
    },
  });

  function handleSubmit() {
    setValidationError('');
    const payload: {
      type: typeof selectedType;
      reason: string;
      proposedDate?: string;
      scheduleId?: string;
      originalDate?: string;
    } = { type: selectedType, reason: reason.trim() };

    if (!payload.reason || !proposedDate) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    const proposed = new Date(proposedDate);
    payload.proposedDate = proposed.toISOString();

    if (selectedType === 'MODIFICATION') {
      if (!scheduleId || !selectedSlot) {
        setValidationError('Select an existing working day to replace.');
        return;
      }

      const original = dateForDayInWeek(selectedSlot.dayOfWeek, getStartOfWeekIso());
      payload.originalDate = original.toISOString();
      payload.scheduleId = scheduleId;

      if (!isSameWeek(original, proposed)) {
        setValidationError('The replacement day must be in the same week as your current schedule.');
        return;
      }

      const proposedDay = proposed.getUTCDay();
      const workingDays = new Set((mySlots ?? []).map((s: any) => s.dayOfWeek));
      if (workingDays.has(proposedDay)) {
        setValidationError('The target day must be a non-working day (not already in your schedule).');
        return;
      }

      if (proposedDay === selectedSlot.dayOfWeek) {
        setValidationError('The target day must differ from the day being replaced.');
        return;
      }
    }

    if (selectedType === 'ADDITIONAL' || selectedType === 'COMPENSATION') {
      const proposedDay = proposed.getUTCDay();
      const workingDays = new Set((mySlots ?? []).map((s: any) => s.dayOfWeek));
      if (workingDays.has(proposedDay)) {
        setValidationError('The selected date must be a day you do not normally work.');
        return;
      }
    }

    mutation.mutate(payload);
  }

  const selectedSlot = mySlots?.find((s: any) => s.id === scheduleId);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-2 text-xs mb-5" style={{ color: '#4a5569' }}>
        <span>Dashboard</span><span>›</span><span>Requests</span><span>›</span>
        <span style={{ color: '#1a2f5e', fontWeight: 600 }}>New Schedule Request</span>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Georgia', serif", color: '#1a2f5e' }}>
        New Schedule Request
      </h1>

      {submitted && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm" style={{ background: '#dcfce7', color: '#16a34a' }}>
          Request submitted successfully — it's now pending your Head of Department's review.
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* Request Type */}
          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: '#dce6f5' }}>
            <h2 className="font-semibold text-sm mb-1" style={{ color: '#1a2f5e' }}>Request Type</h2>
            <p className="text-xs mb-4" style={{ color: '#4a5569' }}>Select the type of schedule modification you need</p>
            <div className="space-y-2.5">
              {REQUEST_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => setSelectedType(rt.id)}
                  className="w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all"
                  style={selectedType === rt.id ? { borderColor: '#1a2f5e', background: '#e8f0fe' } : { borderColor: '#dce6f5', background: 'white' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={selectedType === rt.id ? { background: '#1a2f5e' } : { background: '#f0f4f9' }}>
                    {rt.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: selectedType === rt.id ? '#1a2f5e' : '#334155' }}>{rt.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a5569' }}>{rt.desc}</p>
                  </div>
                  <div className="ml-auto mt-1">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={selectedType === rt.id ? { borderColor: '#1a2f5e', background: '#1a2f5e' } : { borderColor: '#dce6f5' }}>
                      {selectedType === rt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Details */}
          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: '#dce6f5' }}>
            <h2 className="font-semibold text-sm mb-1" style={{ color: '#1a2f5e' }}>Schedule Details</h2>
            <p className="text-xs mb-5" style={{ color: '#4a5569' }}>
              {selectedType === 'MODIFICATION'
                ? 'Pick which of your current days you want to change'
                : 'Pick the date this applies to'}
            </p>

            {selectedType === 'MODIFICATION' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ color: '#1a2f5e' }}>REPLACE THIS DAY</label>
                <div className="space-y-2">
                  {mySlots?.length ? mySlots.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setScheduleId(s.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all"
                      style={scheduleId === s.id ? { borderColor: '#1a2f5e', background: '#e8f0fe', color: '#1a2f5e', fontWeight: 600 } : { borderColor: '#dce6f5', color: '#4a5569' }}
                    >
                      {DAY_NAMES[s.dayOfWeek]} — {s.startTime}–{s.endTime}
                    </button>
                  )) : (
                    <p className="text-xs" style={{ color: '#94a3b8' }}>No scheduled days found yet.</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#1a2f5e' }}>
                {selectedType === 'MODIFICATION' ? 'NEW WORKING DAY (must be a non-working day this week)' : 'DATE'}
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={selectedType === 'MODIFICATION' ? getStartOfWeekIso() : undefined}
                max={selectedType === 'MODIFICATION' ? (() => {
                  const end = new Date(getStartOfWeekIso() + 'T00:00:00.000Z');
                  end.setUTCDate(end.getUTCDate() + 6);
                  return end.toISOString().split('T')[0];
                })() : undefined}
                className="px-3 py-2.5 rounded-lg border text-sm w-full"
                style={{ borderColor: '#dce6f5', color: '#1a2f5e' }}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: '#dce6f5' }}>
            <h2 className="font-semibold text-sm mb-3" style={{ color: '#1a2f5e' }}>Request Comments</h2>
            <textarea
              className="w-full p-3 rounded-lg border text-sm resize-none outline-none"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're requesting this change…"
              style={{ borderColor: '#dce6f5', color: '#4a5569', background: '#f8faff' }}
            />
          </div>

          {validationError && (
            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#fee2e2', color: '#dc2626' }}>
              {validationError}
            </div>
          )}

          {mutation.isError && (
            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#fee2e2', color: '#dc2626' }}>
              {getApiErrorMessage(mutation.error, 'Could not submit request. Please check the fields above.')}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending || (selectedType === 'MODIFICATION' && !scheduleId) || !reason.trim() || !proposedDate}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: '#1a2f5e' }}
            >
              {mutation.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border sticky top-0" style={{ borderColor: '#dce6f5' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#1a2f5e' }}>Request Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#4a5569' }}>Type</span>
                <span className="font-semibold" style={{ color: '#1a2f5e' }}>
                  {REQUEST_TYPES.find((t) => t.id === selectedType)?.title}
                </span>
              </div>
              {selectedType === 'MODIFICATION' && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#4a5569' }}>From</span>
                  <span className="font-semibold" style={{ color: '#dc2626' }}>
                    {selectedSlot ? `${DAY_NAMES[selectedSlot.dayOfWeek]} ${selectedSlot.startTime}` : '—'}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span style={{ color: '#4a5569' }}>Date</span>
                <span className="font-semibold" style={{ color: '#16a34a' }}>{proposedDate || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#4a5569' }}>Status after submit</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fef3c7', color: '#d97706' }}>
                  Pending Review
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: '#f0f4f9' }}>
              <p className="text-xs" style={{ color: '#4a5569' }}>
                Your request will be sent to your Head of Department for review. You'll see the status update on this page once a decision is made.
              </p>
            </div>
          </div>

          <div className="rounded-xl p-4 border" style={{ background: '#f8faff', borderColor: '#dce6f5' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#1a2f5e' }}>Your Schedule This Week</p>
            {mySlots?.length ? mySlots.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 py-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#1a2f5e' }} />
                <span className="text-xs" style={{ color: '#4a5569' }}>{DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}</span>
              </div>
            )) : (
              <p className="text-xs" style={{ color: '#94a3b8' }}>No schedule slots yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl p-5 border" style={{ borderColor: '#dce6f5' }}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: '#1a2f5e' }}>My Request History</h2>
        {myRequests?.length ? (
          <div className="divide-y" style={{ borderColor: '#f0f4f9' }}>
            {myRequests.map((r: any) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: '#1a2f5e' }}>{r.type}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#4a5569' }}>{r.reason || 'No comment'}</p>
                  {r.proposedDate && (
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      Target: {new Date(r.proposedDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                    Submitted {new Date(r.createdAt).toLocaleDateString()}
                    {r.reviewedAt && ` · Reviewed ${new Date(r.reviewedAt).toLocaleDateString()}`}
                  </p>
                  {r.status === 'REJECTED' && r.reviewComment && (
                    <p className="text-xs mt-1 px-2 py-1 rounded" style={{ background: '#fee2e2', color: '#dc2626' }}>
                      HoD feedback: {r.reviewComment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#94a3b8' }}>No requests submitted yet.</p>
        )}
      </div>
    </div>
  );
}

export default ScheduleRequest;