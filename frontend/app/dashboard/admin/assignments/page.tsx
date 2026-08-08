'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers } from '@/lib/users';
import { getDepartments, assignUserToDepartment } from '@/lib/departments';
interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}
export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const { data: users ,isLoading ,isError} = useQuery({ queryKey: ['users', 1], queryFn: () => getUsers(1, 100) });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  const [userId, setUserId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const mutation = useMutation({
    mutationFn: () => assignUserToDepartment(userId, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setConfirmation('Assigned successfully.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfirmation('');
    mutation.mutate();
  }
  if (isLoading) return <p className="p-6">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please try again.</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Assign Faculty to Department</h1>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="border p-2 w-full">
          <option value="">Select a user</option>
          {users?.map((u: User) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="border p-2 w-full">
          <option value="">Select a department</option>
          {departments?.map((d: Department) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit" className="bg-black text-white p-2 w-full">Assign</button>
      </form>
      {confirmation && <p className="text-green-600 mt-2">{confirmation}</p>}
    </div>
  );
}