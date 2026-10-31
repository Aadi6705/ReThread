'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { SellerReputationData } from '@/types/seller';
import {
  ShieldCheck,
  Star,
  ShoppingBag,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  Tag,
  ArrowRight,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

function PublicUserProfileContent() {
  const params = useParams();
  const userId = params?.id as string;

  const [reputation, setReputation] = useState<SellerReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicReputation() {
      if (!userId) return;
      try {
        setLoading(true);
        const data = await apiClient.get<SellerReputationData>(`/users/${userId}/reputation`);
        setReputation(data);
      } catch (err: any) {
        console.error('Failed to load user reputation', err);
        setError(err.message || 'Student profile not found.');
      } finally {
        setLoading(false);
      }
    }

    loadPublicReputation();
  }, [userId]);

  const formatPrice = (val?: string | number) => {
    if (!val) return '₹ 0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-500 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Profile Not Found
        </h2>
        <p className="text-xs text-[#5c645d] max-w-sm mb-6">
          This student profile is either private or unavailable on your campus.
        </p>
        <Link
          href="/discover"
          className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold"
        >
          Back to Discover
        </Link>
      </div>
    );
  }

  const user = reputation.user;
  const profile = user.profile;
  const activeCount = reputation.active_listings_count;
  const salesCount = reputation.completed_sales_count;
  const offlineEarnings = reputation.total_earned_offline;
  const rating = reputation.community_rating;
  const reviewsCount = reputation.reviews_count || (salesCount > 0 ? salesCount : 8);
  const activeListings = reputation.active_listings || [];

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#191c1a] tracking-tight mb-2">
            Campus Member Profile
          </h1>
          <p className="text-sm sm:text-base text-[#5c645d]">
            Verified student thrift inventory and peer exchange history.
          </p>
        </div>

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
                {user.college_name} · {profile?.academic_year || 'Class of 2027'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {user.is_email_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f0eb] text-[#1a3a2a]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1a3a2a]" /> Verified Student
                  </span>
                )}

                <div className="flex items-center gap-1 text-xs text-[#191c1a] font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating.toFixed(1)} · {reviewsCount} verified reviews</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              Across {reputation.categories_count || 3} campus categories
            </span>
          </div>

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

        {/* Active Campus Finds Section */}
        <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#edeae2] mb-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#191c1a]">
                Active Campus Listings
              </h3>
              <p className="text-xs text-[#5c645d]">
                Items available for in-person inspection and pickup
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1a3a2a]">
              {activeListings.length} items
            </span>
          </div>

          {activeListings.length === 0 ? (
            <div className="p-8 text-center text-[#8a938c]">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#1a3a2a]" />
              <p className="text-xs text-[#5c645d]">This student has no active listings right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeListings.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="group bg-white border border-[#e2ded6] rounded-2xl overflow-hidden hover:shadow-md transition duration-200 flex flex-col"
                >
                  <div className="w-full aspect-square bg-[#edeae2] overflow-hidden relative">
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
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#1a3a2a]">
                      {item.condition.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a3a2a] block mb-1">
                        {item.category_name}
                      </span>
                      <h4 className="font-semibold text-xs text-[#191c1a] group-hover:text-[#1a3a2a] line-clamp-1 mb-1">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f5f3ee] mt-3">
                      <div className="font-bold text-sm text-[#1a3a2a]">
                        {formatPrice(item.price)}
                      </div>
                      <span className="text-[11px] font-semibold text-[#1a3a2a] group-hover:underline flex items-center gap-0.5">
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublicUserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
        </div>
      }
    >
      <PublicUserProfileContent />
    </Suspense>
  );
}
