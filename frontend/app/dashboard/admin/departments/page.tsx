'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment } from '@/lib/departments';
interface Department {
  id: string;
  name: string;
  code: string;
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const { data: departments, isLoading , isError} = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const mutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setName('');
      setCode('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ name, code });
  }
  if (isLoading) return <p className="p-6">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please try again.</p>;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-4">Create Department</h1>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
          <input
            placeholder="Name (e.g. Informatique)" value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full"
          />
          <input
            placeholder="Code (e.g. INFO)" value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border p-2 w-full"
          />
          <button type="submit" className="bg-black text-white p-2 w-full">Create</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">All Departments</h2>
        {isLoading ? <p>Loading...</p> : (
          <ul className="space-y-1">
            {departments?.map((d: Department) => (
              <li key={d.id} className="border p-2 rounded">{d.name} ({d.code})</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}