'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, type UserRecord } from '@/lib/users';
import { getDepartments } from '@/lib/departments';
import { getApiErrorMessage } from '@/lib/api-error';

type Role = 'ADMIN' | 'HOD' | 'FACULTY';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: usersPage, isLoading, isError } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers(page, pageSize),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const users: UserRecord[] = usersPage?.data ?? [];
  const total = usersPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasNextPage = page < totalPages;

  // Create form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('FACULTY');
  const [departmentId, setDepartmentId] = useState('');

  // Edit modal
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Role>('FACULTY');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Delete modal
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'HOD' | 'FACULTY' | 'ADMIN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEmail('');
      setPassword('');
      setFullName('');
      setDepartmentId('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      setEditPassword('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if ((role === 'HOD' || role === 'FACULTY') && !departmentId) return;
    createMutation.mutate({
      email,
      password,
      fullName,
      role,
      ...((role === 'HOD' || role === 'FACULTY') && { departmentId }),
    });
  }

  function openEdit(u: UserRecord) {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditDepartmentId(u.departmentId ?? u.department?.id ?? '');
    setEditPassword('');
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    if ((editRole === 'HOD' || editRole === 'FACULTY') && !editDepartmentId) return;

    updateMutation.mutate({
      id: editingUser.id,
      payload: {
        fullName: editFullName,
        email: editEmail,
        role: editRole,
        departmentId: editRole === 'ADMIN' ? null : editDepartmentId,
        ...(editPassword.trim() && { password: editPassword }),
      },
    });
  }

  const counts = useMemo(() => ({
    ALL: users.length,
    HOD: users.filter((u) => u.role === 'HOD').length,
    FACULTY: users.filter((u) => u.role === 'FACULTY').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesTab = activeTab === 'ALL' || u.role === activeTab;
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  if (isLoading) return <p className="p-6 text-slate-500">Loading users...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please try again.</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Create New User</h1>
        <p className="text-xs text-slate-500 mb-5">Add a new faculty member, HOD, or admin</p>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white">
              <option value="FACULTY">Faculty</option>
              <option value="HOD">Head of Department</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {(role === 'HOD' || role === 'FACULTY') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white">
                <option value="">Select department…</option>
                {(departments ?? []).map((d: { id: string; name: string }) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" disabled={createMutation.isPending}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs p-2.5 rounded-xl disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : '+ Create User'}
          </button>
        </form>
        {createMutation.isError && (
          <p className="text-xs text-red-500 mt-2">
            {getApiErrorMessage(createMutation.error, 'Could not create user.')}
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Faculty & Staff Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Filter by roles or search by name & email</p>
            </div>
            <input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Users', count: counts.ALL },
              { id: 'HOD', label: 'HODs', count: counts.HOD },
              { id: 'FACULTY', label: 'Faculty', count: counts.FACULTY },
              { id: 'ADMIN', label: 'Admins', count: counts.ADMIN },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No users found.</div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                    {u.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{u.fullName}</h4>
                    <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                    <p className="text-[11px] text-slate-400">{u.department?.name || 'No department'} · {u.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(u)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50">
                    Edit
                  </button>
                  <button onClick={() => setDeletingUser(u)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">Page {page} of {totalPages} ({total} users)</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="border px-3 py-1.5 rounded-lg text-xs disabled:opacity-40">Previous</button>
            <button disabled={!hasNextPage} onClick={() => setPage((p) => p + 1)}
              className="border px-3 py-1.5 rounded-lg text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Edit User</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Full Name</label>
                <input required value={editFullName} onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input required type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full border rounded-xl p-2.5 text-xs bg-white">
                  <option value="FACULTY">Faculty</option>
                  <option value="HOD">Head of Department</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {(editRole === 'HOD' || editRole === 'FACULTY') && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Department *</label>
                  <select required value={editDepartmentId} onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs bg-white">
                    <option value="">Select department…</option>
                    {(departments ?? []).map((d: { id: string; name: string }) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">New Password (optional)</label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full border rounded-xl p-2.5 text-xs" />
              </div>
              {updateMutation.isError && (
                <p className="text-xs text-red-500">
                  {getApiErrorMessage(updateMutation.error, 'Update failed.')}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={updateMutation.isPending}
                  className="flex-1 bg-slate-900 text-white text-xs py-2.5 rounded-xl disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingUser(null)}
                  className="flex-1 border text-xs py-2.5 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Delete User?</h2>
            <p className="text-sm text-slate-600">
              Permanently delete <strong>{deletingUser.fullName}</strong> ({deletingUser.email})?
              Their schedules and requests will also be removed.
            </p>
            {deleteMutation.isError && (
              <p className="text-xs text-red-500">
                {getApiErrorMessage(deleteMutation.error, 'Delete failed.')}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => deleteMutation.mutate(deletingUser.id)} disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white text-xs py-2.5 rounded-xl disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button onClick={() => setDeletingUser(null)}
                className="flex-1 border text-xs py-2.5 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
