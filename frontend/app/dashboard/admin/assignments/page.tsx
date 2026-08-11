'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers } from '@/lib/users';
import { getDepartments, assignUserToDepartment } from '@/lib/departments';

interface User {
  id: string;
  fullName?: string;
  email: string;
  role: string;
  department?: {
    name: string;
    code?: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersPage, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'assignments'],
    queryFn: () => getUsers(1, 100),
  });

  const { data: departments, isLoading: deptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const mutation = useMutation({
    mutationFn: ({ userId, departmentId }: { userId: string; departmentId: string }) =>
      assignUserToDepartment(userId, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setSelectedUser('');
      setSelectedDept('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedDept) return;
    mutation.mutate({ userId: selectedUser, departmentId: selectedDept });
  };

  const userList: User[] = usersPage?.data ?? [];
  const deptList: Department[] = departments ?? [];

  const filteredUsers = userList.filter((u) => {
    const search = searchQuery.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.department?.name || '').toLowerCase().includes(search)
    );
  });

  if (usersLoading || deptsLoading) {
    return <p className="p-6 text-slate-500 text-xs font-semibold">Loading assignments data...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>🔗</span> Faculty Assignments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Link professors and academic staff members to their respective departments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
              🎯
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Assign Faculty</h2>
              <p className="text-xs text-slate-400">Select user and department</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select User / Faculty <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition cursor-pointer"
              >
                <option value="">Choose a user...</option>
                {userList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Target Department <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition cursor-pointer"
              >
                <option value="">Choose department...</option>
                {deptList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Current Assignments</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time overview of assigned faculty members</p>
            </div>

            <input
              type="text"
              placeholder="Search faculty or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active faculty assignments found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const hasDept = u.department && u.department.name;
                return (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{u.fullName || 'No Name'}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {hasDept ? (
                        <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px] rounded-lg">
                          {u.department?.name}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-400 font-medium text-[11px] rounded-lg">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
