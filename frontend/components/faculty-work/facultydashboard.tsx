'use client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getMySchedule } from '@/lib/schedules';
import { getMyRequests } from '@/lib/requests';
import { getEvents } from '@/lib/events';
import { logout } from '@/lib/auth';

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

export function FacultyDashboard() {
  const { data: user } = useCurrentUser();

  const { data: mySlots } = useQuery({
    queryKey: ['my-schedule-list', user?.id],
    queryFn: () => getMySchedule(user!.id),
    enabled: !!user,
  });
  const { data: requests } = useQuery({ queryKey: ['my-requests'], queryFn: getMyRequests });
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: getEvents });

  const pendingCount = (requests ?? []).filter((r: any) => r.status === 'PENDING').length;
  const approvedThisMonth = requests?.filter((r: any) => {
    const d = new Date(r.updatedAt);
    const now = new Date();
    return r.status === 'APPROVED' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;

  const STATS = [
    { label: 'Working Days / Week', value: String(mySlots?.length ?? 0), sub: mySlots?.map((s: any) => DAY_NAMES[s.dayOfWeek]).join(' · ') || '—', color: '#1a2f5e' },
    { label: 'Pending Requests', value: String(pendingCount), sub: 'Awaiting approval', color: '#f59e0b' },
    { label: 'Approved This Month', value: String(approvedThisMonth), sub: 'Successfully approved', color: '#22c55e' },
    { label: 'Events This Week', value: String(events?.length ?? 0), sub: 'Active department events', color: '#2a4a8c' },
  ];

  const activeDays = new Set(mySlots?.map((s: any) => s.dayOfWeek));
  const pendingModification = requests?.find((r: any) => r.status === 'PENDING' && r.type === 'MODIFICATION');

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: '#f0f4f9' }}>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Georgia', serif", color: '#1a2f5e' }}>My Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4a5569' }}>Welcome back, {user?.email}</p>
          </div>
          <a href="/dashboard/faculty/requests" className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#1a2f5e' }}>
            + New Request
          </a>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border" style={{ borderColor: '#dce6f5' }}>
              <p className="text-xs font-medium mb-1" style={{ color: '#4a5569' }}>{s.label}</p>
              <p className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2 bg-white rounded-xl p-5 border" style={{ borderColor: '#dce6f5' }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#1a2f5e' }}>This Week's Schedule</h2>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((day) => (
                <div key={day} className="rounded-xl p-3 text-center" style={activeDays.has(day) ? { background: '#1a2f5e', color: 'white' } : { background: '#f0f4f9', color: '#4a5569' }}>
                  <p className="text-xs font-medium mb-1">{DAY_NAMES[day]}</p>
                  {activeDays.has(day) && <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60 mx-auto" />}
                </div>
              ))}
            </div>
            {pendingModification && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: '#fef3c7', color: '#92400e' }}>
                ⚠ Swap Request Pending — awaiting HoD approval.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: '#dce6f5' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: '#1a2f5e' }}>Recent Requests</h2>
              <a href="/dashboard/faculty/requests" className="text-xs font-medium" style={{ color: '#2a4a8c' }}>View All</a>
            </div>
            <div className="space-y-3">
              {requests?.slice(0, 3).map((r: any) => (
                <div key={r.id} className="pb-3 border-b last:border-b-0" style={{ borderColor: '#f0f4f9' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: '#1a2f5e' }}>{r.type}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs" style={{ color: '#4a5569' }}>{r.reason || 'No comment'}</p>
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              )) ?? <p className="text-xs" style={{ color: '#94a3b8' }}>No requests yet.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border" style={{ borderColor: '#dce6f5' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1a2f5e' }}>Upcoming Events</h2>
            <a href="/dashboard/faculty/events" className="text-xs font-medium" style={{ color: '#2a4a8c' }}>View All Events</a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {events?.slice(0, 3).map((e: any) => (
              <div key={e.id} className="p-4 rounded-xl border" style={{ borderColor: '#dce6f5', background: '#f8faff' }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#1a2f5e' }}>{e.title}</p>
                <p className="text-xs" style={{ color: '#4a5569' }}>{new Date(e.eventDate).toLocaleDateString()}</p>
                {e.description && <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{e.description}</p>}
              </div>
            )) ?? <p className="text-xs" style={{ color: '#94a3b8' }}>No upcoming events.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default FacultyDashboard;