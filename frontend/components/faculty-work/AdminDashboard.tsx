'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment } from '@/lib/departments';
import { getUsers, createUser } from '@/lib/users';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: '#dcfce7', color: '#16a34a' },
    'On Leave': { bg: '#fef3c7', color: '#d97706' },
    Inactive: { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[status] || { bg: '#e8f0fe', color: '#2a4a8c' };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: departments, isLoading: deptsLoading } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });
  const { data: usersPage, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 1, 50],
    queryFn: () => getUsers(1, 50),
  });

  const [showAddDept, setShowAddDept] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'FACULTY' | 'HOD' | 'ADMIN'>('FACULTY');
  const [newDeptId, setNewDeptId] = useState('');

  const addDeptMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeptName('');
      setDeptCode('');
      setShowAddDept(false);
    },
  });

  const addUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewDeptId('');
      setShowAddFaculty(false);
    },
  });

  const users = usersPage?.data ?? [];
  const departmentCount = departments?.length ?? 0;
  const facultyCount = users.filter((u: any) => u.role === 'FACULTY').length;
  const hodCount = users.filter((u: any) => u.role === 'HOD').length;

  const STATS = [
    { label: 'Total Departments', value: String(departmentCount), icon: '🏛', color: '#1a2f5e' },
    { label: 'Faculty Members', value: String(facultyCount), icon: '👩‍🏫', color: '#2a4a8c' },
    { label: 'Heads of Dept.', value: String(hodCount), icon: '👔', color: '#c9a84c' },
    { label: 'Total Users', value: String(users.length), icon: '📋', color: '#f59e0b' },
  ];

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: '#f0f4f9' }}>
      

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Georgia', serif", color: '#1a2f5e' }}>Admin Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4a5569' }}>System overview — Manage departments, faculty, and heads</p>
          </div>
          <button
            onClick={() => setShowAddFaculty(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
            style={{ background: '#1a2f5e' }}
          >
            + Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border flex items-center gap-4" style={{ borderColor: '#dce6f5' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: '#f0f4f9' }}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a5569' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {showAddFaculty && (
          <div className="bg-white rounded-xl border p-5 mb-5" style={{ borderColor: '#dce6f5' }}>
            <h2 className="font-semibold text-sm mb-3" style={{ color: '#1a2f5e' }}>Add User</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Full name" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#dce6f5' }} />
              <input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#dce6f5' }} />
              <input placeholder="Temporary password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#dce6f5' }} />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#dce6f5' }}>
                <option value="FACULTY">Faculty Member</option>
                <option value="HOD">Head of Department</option>
                <option value="ADMIN">Administrator</option>
              </select>
              {newRole !== 'ADMIN' && (
                <select value={newDeptId} onChange={(e) => setNewDeptId(e.target.value)} className="px-3 py-2 rounded-lg border text-sm col-span-2" style={{ borderColor: '#dce6f5' }}>
                  <option value="">No department yet</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addUserMutation.mutate({ email: newEmail, password: newPassword, fullName: newFullName, role: newRole, ...(newDeptId && { departmentId: newDeptId }) } as any)}
                disabled={addUserMutation.isPending || !newEmail || !newPassword || !newFullName}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                style={{ background: '#1a2f5e' }}
              >
                {addUserMutation.isPending ? 'Creating…' : 'Create User'}
              </button>
              <button onClick={() => setShowAddFaculty(false)} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#dce6f5', color: '#4a5569' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          {/* Departments table */}
          <div className="col-span-3 bg-white rounded-xl border" style={{ borderColor: '#dce6f5' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f0f4f9' }}>
              <h2 className="font-semibold text-sm" style={{ color: '#1a2f5e' }}>Departments</h2>
              <button onClick={() => setShowAddDept(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ background: '#2a4a8c' }}>
                + Add Dept
              </button>
            </div>

            {showAddDept && (
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: '#f0f4f9', background: '#f8faff' }}>
                <input placeholder="Name" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="px-2 py-1.5 rounded border text-xs flex-1" style={{ borderColor: '#dce6f5' }} />
                <input placeholder="Code" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} className="px-2 py-1.5 rounded border text-xs w-24" style={{ borderColor: '#dce6f5' }} />
                <button
                  onClick={() => addDeptMutation.mutate({ name: deptName, code: deptCode })}
                  disabled={addDeptMutation.isPending || !deptName || !deptCode}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-60"
                  style={{ background: '#1a2f5e' }}
                >
                  Save
                </button>
              </div>
            )}

            <div className="divide-y" style={{ borderColor: '#f0f4f9' }}>
              {deptsLoading && <p className="px-5 py-4 text-xs" style={{ color: '#94a3b8' }}>Loading…</p>}
              {departments?.map((d: any) => {
                const deptFaculty = users.filter((u: any) => u.departmentId === d.id);
                return (
                  <div key={d.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: '#e8f0fe' }}>🏛</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#1a2f5e' }}>{d.name}</p>
                      <p className="text-xs" style={{ color: '#4a5569' }}>Code: {d.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: '#1a2f5e' }}>{deptFaculty.length}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>members</p>
                    </div>
                  </div>
                );
              })}
              {!deptsLoading && departments?.length === 0 && (
                <p className="px-5 py-4 text-xs" style={{ color: '#94a3b8' }}>No departments yet — add one above.</p>
              )}
            </div>
          </div>

          {/* Users list */}
          <div className="col-span-2 bg-white rounded-xl border" style={{ borderColor: '#dce6f5' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#f0f4f9' }}>
              <h2 className="font-semibold text-sm" style={{ color: '#1a2f5e' }}>All Users</h2>
            </div>
            <div className="divide-y" style={{ borderColor: '#f0f4f9' }}>
              {usersLoading && <p className="px-5 py-4 text-xs" style={{ color: '#94a3b8' }}>Loading…</p>}
              {users.map((u: any) => (
                <div key={u.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: '#1a2f5e' }}>{u.fullName}</span>
                    <StatusBadge status={u.role === 'FACULTY' ? 'Active' : u.role} />
                  </div>
                  <p className="text-xs" style={{ color: '#4a5569' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                    {departments?.find((d: any) => d.id === u.departmentId)?.name ?? 'No department'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;