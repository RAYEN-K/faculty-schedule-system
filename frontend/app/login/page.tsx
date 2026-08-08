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
      className="min-h-screen flex"
      style={{ fontFamily: "'Inter', sans-serif", background: '#f0f4f9' }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{ background: '#1a2f5e' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: '#c9a84c', color: '#1a2f5e' }}
          >
            FW
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">
            FacultyWork
          </span>
        </div>

        <div>
          <h1
            className="text-4xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Flexible Schedule
            <br />
            Management
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-sm">
            A centralised platform for faculty members and department heads to
            manage, request, and approve weekly work schedules with ease.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '📅', label: 'Submit schedule modification requests' },
              { icon: '✅', label: 'Fast approval workflows for HoDs' },
              { icon: '📊', label: 'Full visibility across department schedules' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-blue-100 text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-xs">
          © {new Date().getFullYear()} FacultyWork. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: '#c9a84c', color: '#1a2f5e' }}
            >
              FW
            </div>
            <span
              className="font-semibold text-lg"
              style={{ color: '#1a2f5e' }}
            >
              FacultyWork
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border p-8"
            style={{ borderColor: '#dce6f5' }}
          >
            <h2
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'Georgia', serif", color: '#1a2f5e' }}
            >
              Welcome back
            </h2>
            <p className="text-sm mb-8" style={{ color: '#4a5569' }}>
              Sign in to your faculty portal account
            </p>

            {error && (
              <div
                className="mb-4 px-3 py-2 rounded-lg text-xs"
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
                  placeholder="dr.rivera@university.edu"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
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
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
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
              className="w-full mt-6 py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 cursor-pointer"
              style={{ background: '#1a2f5e' }}
            >
              {submitting ? 'Signing in…' : 'Sign In to Portal'}
            </button>

            <div className="mt-4 text-center">
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
    </div>
  );
}

export default Login;