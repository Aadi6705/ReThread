'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ShieldCheck, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid college email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a href="/" className="inline-block">
          <span className="font-serif text-3xl font-bold tracking-tight text-[#1a3a2a]">
            ReThread
          </span>
        </a>
        <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[#191c1a]">
          Welcome back to campus thrift
        </h2>
        <p className="mt-1 text-sm text-[#5c645d]">
          Sign in with your email address
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#e2ded6] sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-rose-800 leading-relaxed">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@gmail.com or student@iitd.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d]"
                >
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#1a3a2a] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a938c] hover:text-[#1a3a2a]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log In to Campus</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-6 border-t border-[#edeae2] text-center">
            <p className="text-xs text-[#5c645d]">
              New student to ReThread?{' '}
              <a
                href="/register"
                className="font-bold text-[#1a3a2a] hover:underline"
              >
                Register with college email
              </a>
            </p>
          </div>
        </div>

        {/* Verified Student Security Badge */}
        <div className="mt-6 p-4 rounded-2xl bg-[#e8f0eb] border border-[#d8e5dc] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#1a3a2a] shrink-0" />
          <p className="text-xs text-[#1a3a2a] font-medium leading-relaxed">
            Exclusively restricted to authenticated university students. All offline exchanges occur on designated campus grounds.
          </p>
        </div>
      </div>
    </div>
  );
}
