'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#e8f0eb] border border-[#d8e5dc] flex items-center justify-center mx-auto text-[#1a3a2a] mb-4 shadow-sm">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1a3a2a]">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-[#5c645d]">
          Enter your registered college email and we will dispatch a reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#e2ded6] sm:px-10">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1a3a2a] mb-1">
                Reset Link Sent
              </h3>
              <p className="text-xs text-[#5c645d] mb-4">
                If an account exists for {email}, instructions to reset your password have been dispatched.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold"
              >
                Return to Login <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose-800 leading-relaxed">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
                  >
                    College Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="student@iitd.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition"
                  />
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
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-[#edeae2] text-center">
                <a
                  href="/login"
                  className="text-xs font-bold text-[#1a3a2a] hover:underline"
                >
                  Remembered password? Back to login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
