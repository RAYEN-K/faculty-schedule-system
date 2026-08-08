'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser } from '@/lib/users';
interface User {
  id: string;
  email: string;
  role: string;
  fullName?:string;
  department?: {
  name: string;
  
  };
}
export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: users, isLoading , isError } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers(page, pageSize),
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'HOD' | 'FACULTY'>('FACULTY');

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEmail(''); setPassword(''); setFullName('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ email, password, fullName, role });
  }

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Something went wrong. Please try again.</p>;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-4">Create User</h1>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
          <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border p-2 w-full" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 w-full" />
          <select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'HOD' | 'FACULTY')}className="border p-2 w-full">
            <option value="FACULTY">Faculty</option>
            <option value="HOD">Head of Department</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="bg-black text-white p-2 w-full">Create</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">All Users</h2>
        {isLoading ? <p>Loading...</p> : (
          <>
            <ul className="space-y-1">
              {users?.map((u: User) => (
                <li key={u.id} className="border p-2 rounded">{u.fullName} — {u.email} — {u.role}</li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="border px-3 py-1 disabled:opacity-40">Previous</button>
              <span>Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} className="border px-3 py-1">Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}