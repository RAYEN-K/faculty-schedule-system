'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, getCurrentUser } from '@/lib/auth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      const user = await getCurrentUser();
      if (user?.role === 'ADMIN') {
        router.push('/dashboard/admin/users');
      } else if (user?.role === 'HOD') {
        router.push('/dashboard/hod/requests');
      } else {
        router.push('/dashboard/faculty');
      }
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message || err;
      if (typeof apiMessage === 'string') {
        setError(apiMessage);
      } else if (Array.isArray(apiMessage)) {
        setError(apiMessage.join(', '));
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif", background: '#f0f4f9' }}
    >
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border p-8"
          style={{ borderColor: '#dce6f5' }}
        >
          {/* IIT LOGO HEADER */}
          <div className="text-center mb-6">
            <img
              src="/iit-logo.png"
              alt="IIT Logo"
              className="h-16 w-auto mx-auto object-contain mb-3"
            />
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: '#1a2f5e' }}
            >
              Welcome back
            </h2>
            <p className="text-xs text-slate-500">
              Sign in to your faculty portal account
            </p>
          </div>

          {error && (
            <div
              className="mb-4 px-3 py-2 rounded-lg text-xs text-center"
              style={{ background: '#fee2e2', color: '#dc2626' }}
            >
              {String(error)}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#1a2f5e' }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@iitsfax.tn"
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-[#1a2f5e]"
                style={{
                  borderColor: '#dce6f5',
                  color: '#1a2f5e',
                  background: '#f8faff',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#1a2f5e' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-[#1a2f5e]"
                style={{
                  borderColor: '#dce6f5',
                  color: '#1a2f5e',
                  background: '#f8faff',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 cursor-pointer hover:opacity-90 shadow-sm"
            style={{ background: '#1a2f5e' }}
          >
            {submitting ? 'Signing in…' : 'Sign In to Portal'}
          </button>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <span className="text-xs" style={{ color: '#4a5569' }}>
              Need access?{' '}
              <span className="font-semibold" style={{ color: '#2a4a8c' }}>
                Contact your administrator
              </span>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;