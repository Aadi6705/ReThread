'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenParam);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
      handleAutoVerify(tokenParam);
    }
  }, [tokenParam]);

  const handleAutoVerify = async (tok: string) => {
    setLoading(true);
    setError(null);
    try {
      await verifyEmail(tok);
      setSuccess(true);
      setTimeout(() => router.push('/'), 2500);
    } catch (err: any) {
      setError(err.message || 'Verification token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await verifyEmail(token.trim());
      setSuccess(true);
      setTimeout(() => router.push('/'), 2500);
    } catch (err: any) {
      setError(err.message || 'Verification token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailParam) {
      setError('Please enter your email to resend verification.');
      return;
    }
    setResending(true);
    setResendStatus(null);
    try {
      await apiClient.post('/auth/resend-verification', { email: emailParam });
      setResendStatus('A fresh verification link has been dispatched to your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#e8f0eb] border border-[#d8e5dc] flex items-center justify-center mx-auto text-[#1a3a2a] mb-4 shadow-sm">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1a3a2a]">
          Verify your student email
        </h2>
        <p className="mt-2 text-sm text-[#5c645d] max-w-sm mx-auto leading-relaxed">
          {emailParam ? (
            <>
              We sent a verification token to{' '}
              <span className="font-semibold text-[#191c1a]">{emailParam}</span>.
            </>
          ) : (
            'Enter the verification token received in your campus email inbox.'
          )}
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
                Email Verified!
              </h3>
              <p className="text-xs text-[#5c645d] mb-4">
                Your campus thrift account is now active. Redirecting to marketplace...
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold"
              >
                Enter Marketplace <ArrowRight className="w-3.5 h-3.5" />
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

              {resendStatus && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                    {resendStatus}
                  </p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="token"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
                  >
                    Verification Token or Code
                  </label>
                  <input
                    id="token"
                    type="text"
                    required
                    placeholder="Paste token or code here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm text-center font-mono placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !token.trim()}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Activate Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {emailParam && (
                <div className="mt-6 pt-6 border-t border-[#edeae2] text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a3a2a] hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>Did not receive email? Resend verification</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
