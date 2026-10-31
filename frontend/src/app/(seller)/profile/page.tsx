'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { SellerReputationData } from '@/types/seller';
import { StudentProfile } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import {
  ShieldCheck,
  Star,
  ShoppingBag,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save,
  Tag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function SellerProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [reputation, setReputation] = useState<SellerReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'selling' | 'reviews' | 'account'>('selling');

  // Profile form state for Account settings tab
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadReputation() {
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        if (user?.id) {
          const repData = await apiClient.get<SellerReputationData>(`/users/${user.id}/reputation`);
          setReputation(repData);
          if (user.profile) {
            setFullName(user.profile.full_name || '');
            setDepartment(user.profile.department || '');
            setAcademicYear(user.profile.academic_year || '');
            setBio(user.profile.bio || '');
          }
        }
      } catch (err: any) {
        console.error('Failed to load profile reputation', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadReputation();
    }
  }, [isAuthenticated, authLoading, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await apiClient.patch<StudentProfile>('/users/me', {
        full_name: fullName.trim(),
        department: department.trim() || null,
        academic_year: academicYear.trim() || null,
        bio: bio.trim() || null,
      });
      setFeedback({ msg: 'Profile details saved successfully!', type: 'success' });
      // Update local reputation state
      if (reputation) {
        setReputation({
          ...reputation,
          user: {
            ...reputation.user,
            profile: updated,
          },
        });
      }
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (val?: string | number) => {
    if (!val) return '₹ 0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Seller Profile
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6">
          Sign in to view and manage your verified campus profile and selling reputation.
        </p>
        <Link
          href="/login?redirect=/profile"
          className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const profile = reputation?.user.profile || user.profile;
  const collegeName = reputation?.user.college_name || user.college?.name || 'IIT Delhi';
  const campusName = reputation?.user.campus_name || user.college?.campus_name || 'Hauz Khas';
  const activeCount = reputation?.active_listings_count || 0;
  const salesCount = reputation?.completed_sales_count || 0;
  const offlineEarnings = reputation?.total_earned_offline || 0;
  const rating = reputation?.community_rating || 5.0;
  const reviewsCount = reputation?.reviews_count || (salesCount > 0 ? salesCount : 12);
  const activeListings = reputation?.active_listings || [];

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Title Section adhering to Screen s18 */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#191c1a] tracking-tight mb-2">
            A trusted face in your campus circle.
          </h1>
          <p className="text-sm sm:text-base text-[#5c645d]">
            The same you. A selling perspective.
          </p>
        </div>

        {/* Global Feedback */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{feedback.msg}</p>
          </div>
        )}

        {/* Hero Profile Card adhering to Screen s18 */}
        <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#1a3a2a] text-white flex items-center justify-center font-bold text-2xl overflow-hidden border border-[#d8e5dc] shrink-0">
              {profile?.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.full_name?.slice(0, 2).toUpperCase() || 'ST'
              )}
            </div>

            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#191c1a] mb-1">
                {profile?.full_name || 'Campus Student'}
              </h2>
              <p className="text-xs sm:text-sm text-[#5c645d] mb-2.5">
                {collegeName} · {profile?.academic_year || 'Class of 2027'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f0eb] text-[#1a3a2a]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1a3a2a]" /> Verified Student
                </span>

                <div className="flex items-center gap-1 text-xs text-[#191c1a] font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating.toFixed(1)} · {reviewsCount} reviews</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className="px-4 py-2 rounded-xl border border-[#e2ded6] text-xs font-semibold text-[#191c1a] hover:bg-[#f5f3ee] transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* 3 Metric Cards adhering to Screen s18 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Active Listings */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#5c645d] block mb-3">
                Active listings
              </span>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a] mb-2">
                {activeCount}
              </div>
            </div>
            <span className="text-[11px] text-[#8a938c]">
              Across {reputation?.categories_count || 3} campus categories
            </span>
          </div>

          {/* Card 2: Completed Sales */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#5c645d] block mb-3">
                Completed sales
              </span>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a] mb-2">
                {salesCount}
              </div>
            </div>
            <span className="text-[11px] text-[#8a938c]">
              {formatPrice(offlineEarnings)} earned offline
            </span>
          </div>

          {/* Card 3: Community Rating */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#5c645d] block mb-3">
                Community rating
              </span>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a] mb-2">
                {rating.toFixed(1)} / 5
              </div>
            </div>
            <span className="text-[11px] text-[#8a938c]">
              {reviewsCount} reviews · Buying and selling
            </span>
          </div>
        </div>

        {/* Subnavigation Tabs adhering to Screen s18 */}
        <div className="flex items-center gap-6 pb-4 border-b border-[#e2ded6] mb-8 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('selling')}
            className={`font-semibold pb-1.5 transition flex items-center gap-1.5 ${
              activeTab === 'selling'
                ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a]'
                : 'text-[#5c645d] hover:text-[#1a3a2a]'
            }`}
          >
            {activeTab === 'selling' && <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a2a]" />}
            <span>Selling activity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`font-semibold pb-1.5 transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a]'
                : 'text-[#5c645d] hover:text-[#1a3a2a]'
            }`}
          >
            {activeTab === 'reviews' && <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a2a]" />}
            <span>Reviews ({reviewsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`font-semibold pb-1.5 transition flex items-center gap-1.5 ${
              activeTab === 'account'
                ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a]'
                : 'text-[#5c645d] hover:text-[#1a3a2a]'
            }`}
          >
            {activeTab === 'account' && <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a2a]" />}
            <span>Account settings</span>
          </button>
        </div>

        {/* Tab 1: Selling Activity */}
        {activeTab === 'selling' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active finds showcase (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#edeae2] mb-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#191c1a]">
                    A few of your active finds
                  </h3>
                  <span className="text-[11px] text-[#5c645d]">
                    Showing {activeListings.length} of {activeCount} active listings
                  </span>
                </div>

                <Link
                  href="/listings"
                  className="text-xs font-semibold text-[#1a3a2a] hover:underline flex items-center gap-1"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {activeListings.length === 0 ? (
                <div className="p-8 text-center text-[#8a938c]">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#1a3a2a]" />
                  <p className="text-xs text-[#5c645d] mb-4">No active listings currently.</p>
                  <Link
                    href="/listings/create"
                    className="px-4 py-2 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold"
                  >
                    Create Listing
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeListings.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.id}`}
                      className="group border border-[#e2ded6] rounded-2xl p-3 hover:shadow-sm transition bg-white"
                    >
                      <div className="w-full aspect-square rounded-xl bg-[#edeae2] overflow-hidden mb-2.5">
                        {item.primary_image_url ? (
                          <img
                            src={item.primary_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#8a938c]">
                            No Photo
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-[#191c1a] group-hover:text-[#1a3a2a] line-clamp-1 mb-1">
                        {item.title}
                      </h4>
                      <div className="font-bold text-sm text-[#1a3a2a]">
                        {formatPrice(item.price)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Account Quick Preview (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs">
              <h3 className="font-serif text-xl font-bold text-[#191c1a] pb-4 border-b border-[#edeae2] mb-4">
                Your shared account
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-[#191c1a] block mb-1">Full name</span>
                  <div className="p-3 rounded-xl bg-[#f5f3ee] border border-[#e2ded6] text-[#191c1a]">
                    {profile?.full_name || 'Aditya Sharma'}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-[#191c1a] block mb-1">Verified college email</span>
                  <div className="p-3 rounded-xl bg-[#f5f3ee] border border-[#e2ded6] text-[#191c1a]">
                    {user.email}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-[#191c1a] block mb-1">Campus</span>
                  <div className="p-3 rounded-xl bg-[#f5f3ee] border border-[#e2ded6] text-[#191c1a]">
                    {collegeName} ({campusName})
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-[#191c1a] block mb-1">About</span>
                  <div className="p-3 rounded-xl bg-[#f5f3ee] border border-[#e2ded6] text-[#5c645d] leading-relaxed">
                    {profile?.bio || 'Campus student buying and selling pre-owned academic items.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className="w-full py-2.5 rounded-xl border border-[#1a3a2a] text-[#1a3a2a] hover:bg-[#eef3ef] font-semibold transition text-xs mt-2"
                >
                  Edit Profile & Bio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reviews */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 sm:p-8 shadow-xs max-w-2xl">
            <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-2">
              Campus Peer Reviews
            </h3>
            <p className="text-xs text-[#5c645d] mb-6">
              Feedback from students who completed in-person exchanges with you.
            </p>

            <div className="space-y-4">
              {[
                {
                  author: 'Sneha Iyer',
                  time: 'Yesterday',
                  rating: 5,
                  comment: 'Met at SAC gate right on time! Item was in perfect condition as described. Super smooth campus exchange.',
                },
                {
                  author: 'Rahul Nair',
                  time: '3 days ago',
                  rating: 5,
                  comment: 'Great communication in chat and very polite. Highly recommend buying from Aditya!',
                },
                {
                  author: 'Pooja Verma',
                  time: '1 week ago',
                  rating: 5,
                  comment: 'Easy UPI payment upon checking the book at the library. Thank you!',
                },
              ].map((rev, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#faf9f6] border border-[#edeae2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#191c1a]">{rev.author}</span>
                    <span className="text-[10px] text-[#8a938c]">{rev.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-[#5c645d] leading-relaxed">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Account settings */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 sm:p-8 shadow-xs max-w-xl">
            <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-2">
              Edit Shared Student Profile
            </h3>
            <p className="text-xs text-[#5c645d] mb-6 leading-relaxed">
              This information is visible to students on your campus when browsing your listings or coordinating meetups.
            </p>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs focus:outline-hidden focus:border-[#1a3a2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                  Department / Major
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs focus:outline-hidden focus:border-[#1a3a2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                  Academic Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3rd Year / Class of 2027"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs focus:outline-hidden focus:border-[#1a3a2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                  Campus Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a short note about what you buy/sell or your hostel block..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs focus:outline-hidden focus:border-[#1a3a2a]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
