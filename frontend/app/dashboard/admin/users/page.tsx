'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser } from '@/lib/users';

interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  department?: {
    name: string;
  };
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // React Query Fetching
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers(page, pageSize),
  });

  // State Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'HOD' | 'FACULTY'>('FACULTY');

  // State Filter & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'HOD' | 'FACULTY' | 'ADMIN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Mutation Create
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEmail('');
      setPassword('');
      setFullName('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ email, password, fullName, role });
  }

  // حساب أعداد المستخدمين حسب الـ Roles
  const counts = useMemo(() => {
    const userList: User[] = users ?? [];
    return {
      ALL: userList.length,
      HOD: userList.filter((u) => u.role === 'HOD').length,
      FACULTY: userList.filter((u) => u.role === 'FACULTY').length,
      ADMIN: userList.filter((u) => u.role === 'ADMIN').length,
    };
  }, [users]);

  // فلترة القائمة حسب الـ Tab وحسب البحث
  const filteredUsers = useMemo(() => {
    const userList: User[] = users ?? [];
    return userList.filter((u) => {
      const matchesTab = activeTab === 'ALL' || u.role === activeTab;
      const matchesSearch =
        (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  if (isLoading) return <p className="p-6 text-slate-500">Loading users...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please try again.</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
      {/* 1. Form Section: Create User */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Create New User</h1>
        <p className="text-xs text-slate-500 mb-5">Add a new faculty member, HOD, or admin</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              placeholder="e.g. Dr. Walid Trabelsi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="email@iitsfax.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'HOD' | 'FACULTY')}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="FACULTY">Faculty</option>
              <option value="HOD">Head of Department (HOD)</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs p-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : '+ Create User'}
          </button>
        </form>
      </div>

      {/* 2. Directory Section: Users List with Tabs & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Faculty & Staff Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Filter by roles or search by name & email</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Users', count: counts.ALL },
              { id: 'HOD', label: 'HODs', count: counts.HOD },
              { id: 'FACULTY', label: 'Faculty / Teachers', count: counts.FACULTY },
              { id: 'ADMIN', label: 'Admins', count: counts.ADMIN },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Items Feed */}
        <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No users found matching your filter criteria.
            </div>
          ) : (
            filteredUsers.map((u: User) => {
              const isHod = u.role === 'HOD';
              const isAdmin = u.role === 'ADMIN';

              return (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition">
                  <div className="flex items-center gap-3">
                    {/* User Avatar Badge */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isHod
                          ? 'bg-indigo-100 text-indigo-700'
                          : isAdmin
                          ? 'bg-slate-800 text-white'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{u.fullName || 'No Name'}</h4>
                      <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{u.department?.name || 'No department'}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    {isHod && (
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold rounded-lg">
                        HOD
                      </span>
                    )}
                    {isAdmin && (
                      <span className="px-2.5 py-1 bg-slate-900 text-slate-100 text-[11px] font-bold rounded-lg">
                        ADMIN
                      </span>
                    )}
                    {!isHod && !isAdmin && (
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-lg">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500">Page {page}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}