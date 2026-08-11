'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment } from '@/lib/departments';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // Fetching Departments
  const { data: departments, isLoading, isError } = useQuery({
    queryKey: ['departments'],
    queryFn: getUsersDepartments,
  });

  // Helper for safety fallback if API is fetching
  async function getUsersDepartments(): Promise<Department[]> {
    if (typeof getDepartments === 'function') {
      return await getDepartments();
    }
    // Default fallback list if API is not yet linked
    return [
      { id: '1', name: 'Computer Science', code: 'CS' },
      { id: '2', name: 'Electrical Engineering', code: 'EE' },
      { id: '3', name: 'Industrial Engineering', code: 'IE' },
      { id: '4', name: 'Telecommunications Engineering', code: 'TEL' },
      { id: '5', name: 'Mechanical Engineering', code: 'ME' },
    ];
  }

  // Mutation Create Department
  const mutation = useMutation({
    mutationFn: async (newDept: { name: string; code: string }) => {
      if (typeof createDepartment === 'function') {
        return await createDepartment(newDept);
      }
      return newDept;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setName('');
      setCode('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    mutation.mutate({ name, code: code.toUpperCase() });
  };

  const deptList: Department[] = departments ?? [];

  if (isLoading) return <p className="p-6 text-slate-500">Loading departments...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong loading departments.</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏛️</span> Academic Departments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, manage, and inspect all active faculty departments.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-semibold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          {deptList.length} Active Department{deptList.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Create Department */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Create Department</h2>
              <p className="text-xs text-slate-400">Add a new academic unit</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition uppercase font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? 'Creating...' : '+ Create Department'}
            </button>
          </form>
        </div>

        {/* Right Directory: All Departments */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">All Departments</h2>
              <p className="text-xs text-slate-500 mt-0.5">Active faculty departments in the institution</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total: {deptList.length}</span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto">
            {deptList.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-xs text-slate-400">
                No departments found. Use the form to create one.
              </div>
            ) : (
              deptList.map((d) => (
                <div
                  key={d.id}
                  className="group p-4 bg-slate-50/70 border border-slate-200/80 hover:border-indigo-300 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      🏛️
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {d.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">Faculty Unit</p>
                    </div>
                  </div>

                  {/* Code Badge */}
                  <span className="px-3 py-1 bg-white border border-slate-200/80 group-hover:border-indigo-200 text-slate-700 group-hover:text-indigo-700 font-mono font-bold text-xs rounded-lg shadow-2xs whitespace-nowrap">
                    {d.code}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}