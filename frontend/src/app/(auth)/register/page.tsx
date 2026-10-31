'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        full_name: fullName,
        email,
        password,
        department,
        course,
        academic_year: academicYear,
      });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a href="/" className="inline-block">
          <span className="font-serif text-3xl font-bold tracking-tight text-[#1a3a2a]">
            ReThread
          </span>
        </a>
        <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[#191c1a]">
          Join your campus thrift network
        </h2>
        <p className="mt-1 text-sm text-[#5c645d]">
          Create a student account with your verified university email
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition"
              />
            </div>

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
              <p className="mt-1 text-[11px] text-[#8a938c]">
                Accepted domains: .ac.in, .edu, or recognized college domains
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="course"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
                >
                  Degree / Course
                </label>
                <select
                  id="course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm focus:outline-none focus:border-[#1a3a2a] transition"
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="B.Com">B.Com</option>
                  <option value="B.A.">B.A.</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="academicYear"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
                >
                  Academic Year
                </label>
                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm focus:outline-none focus:border-[#1a3a2a] transition"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="department"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
              >
                Department / Branch
              </label>
              <input
                id="department"
                type="text"
                placeholder="Computer Science & Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5c645d] mb-1.5"
              >
                Create Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Student Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#edeae2] text-center">
            <p className="text-xs text-[#5c645d]">
              Already registered?{' '}
              <a
                href="/login"
                className="font-bold text-[#1a3a2a] hover:underline"
              >
                Log in to campus
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-[#e8f0eb] border border-[#d8e5dc] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#1a3a2a] shrink-0" />
          <p className="text-xs text-[#1a3a2a] font-medium leading-relaxed">
            One account for both buying and selling. We will dispatch a verification link to your university inbox.
          </p>
        </div>
      </div>
    </div>
  );
}
