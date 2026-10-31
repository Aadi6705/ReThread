'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { SellerDashboardData } from '@/types/seller';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  CheckCircle2,
  Inbox,
  Eye,
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const dashData = await apiClient.get<SellerDashboardData>('/seller/dashboard');
        setData(dashData);
      } catch (err: any) {
        console.error('Failed to load seller dashboard', err);
        setError(err.message || 'Failed to load seller dashboard.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadDashboard();
    }
  }, [isAuthenticated, authLoading]);

  const formatPrice = (val?: string | number | null) => {
    if (val === undefined || val === null) return '₹ 0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return past.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#e8f0eb] text-[#1a3a2a] flex items-center justify-center mb-4 border border-[#d8e5dc]">
          <TrendingUp className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Seller Portal • Dashboard
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6 leading-relaxed">
          Log in with your verified college email to view your listing performance, buyer enquiries, and offline sales.
        </p>
        <Link
          href="/login?redirect=/dashboard"
          className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const firstName = user?.profile?.full_name?.split(' ')[0] || 'Student';
  const metrics = data?.metrics || {
    active_listings: 0,
    total_views: 0,
    buyer_enquiries: 0,
    total_conversations: 0,
    unread_conversations: 0,
    items_sold: 0,
    total_earned_offline: 0,
    categories_count: 0,
  };

  const pendingNotice = data?.pending_notice;
  const listingPerformance = data?.listing_performance || [];
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Top Header - Adhering strictly to Figma Screen s11 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e2ded6] mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191c1a] tracking-tight mb-1">
              Welcome back, {firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-[#5c645d]">
              Manage your listings and give more products a second life.
            </p>
          </div>

          <Link
            href="/listings/create"
            className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Listing</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* 4 Metrics Cards Grid adhering to Screen s11 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Active Listings */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#5c645d] block mb-3">
                Active Listings
              </span>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a] mb-2">
                {metrics.active_listings}
              </div>
            </div>
            <span className="text-[11px] text-[#8a938c]">
              Ready to find a new home
            </span>
          </div>

          {/* Card 2: Product Views */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#5c645d] block mb-3">
                Product Views
              </span>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a] mb-2">
                {metrics.total_views}
              </div>
            </div>
            <span className="text-[11px] text-[#8a938c]">
              Across your inventory · all time
            </span>
          </div>

          {/* Card 3: Buyer Enquiries */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#5c645d] block mb-3">
                Buyer Enquiries
              </span>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a] mb-2">
                {metrics.buyer_enquiries}
              </div>
            </div>
            <span className="text-[11px] text-[#8a938c]">
              {metrics.total_conversations} conversations · {metrics.unread_conversations} unread
            </span>
          </div>

          {/* Card 4: Items Sold */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#5c645d] block mb-3">
                Items Sold
              </span>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a] mb-2">
                {metrics.items_sold}
              </div>
            </div>
            <span className="text-[11px] text-[#8a938c]">
              {metrics.items_sold} completed campus exchanges
            </span>
          </div>
        </div>

        {/* Action Notice Banner adhering to Screen s11 */}
        {pendingNotice && (
          <Link
            href="/enquiries"
            className="block bg-[#eef3ef] border border-[#dce6df] rounded-2xl p-4 sm:p-5 mb-8 hover:bg-[#e7eee8] transition shadow-xs group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-[#1a3a2a] text-white flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-[#1a3a2a] mb-0.5 group-hover:underline">
                  A buyer is waiting to hear from you.
                </h4>
                <p className="text-xs text-[#2d3a30] leading-relaxed">
                  {pendingNotice.buyer_name} requested your {pendingNotice.listing_title}. Review
                  the request before arranging a meetup.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#1a3a2a] shrink-0 mt-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
        )}

        {/* Bottom Two-Column Grid adhering to Screen s11 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Listing performance (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#edeae2] mb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#191c1a]">
                  Listing performance
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a938c] block mt-0.5">
                  PRODUCT · SHOWING {listingPerformance.length} OF {metrics.active_listings} ACTIVE
                </span>
              </div>

              <Link
                href="/listings"
                className="text-xs font-semibold text-[#1a3a2a] hover:underline flex items-center gap-1"
              >
                <span>View All Listings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {listingPerformance.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-[#8a938c]">
                <ShoppingBag className="w-8 h-8 mb-2 opacity-40 text-[#1a3a2a]" />
                <p className="text-xs text-[#5c645d] max-w-xs mb-4">
                  You haven't published any items yet. Give your textbooks, tech, or dorm gear a second life on campus.
                </p>
                <Link
                  href="/listings/create"
                  className="px-4 py-2 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition"
                >
                  Create Listing
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#edeae2]">
                <div className="grid grid-cols-12 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8a938c] px-2">
                  <div className="col-span-8">Product</div>
                  <div className="col-span-2 text-right">Views</div>
                  <div className="col-span-2 text-right">Enquiries</div>
                </div>

                {listingPerformance.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-center py-3.5 px-2 hover:bg-[#faf9f6] rounded-xl transition gap-2"
                  >
                    {/* Product */}
                    <div className="col-span-8 flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[#edeae2] overflow-hidden border border-[#e2ded6] shrink-0">
                        {item.primary_image_url ? (
                          <img
                            src={item.primary_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-[#8a938c]">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.id}`}
                          className="font-semibold text-xs text-[#191c1a] hover:text-[#1a3a2a] truncate block transition group"
                        >
                          <span className="truncate">{item.title}</span>
                        </Link>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#5c645d] mt-0.5">
                          <span className="font-medium text-[#1a3a2a]">
                            {formatPrice(item.price)}
                          </span>
                          <span>·</span>
                          <span
                            className={`capitalize ${
                              item.status === 'active'
                                ? 'text-emerald-700 font-medium'
                                : 'text-amber-700 font-medium'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Views */}
                    <div className="col-span-2 text-right font-medium text-xs text-[#191c1a]">
                      {item.views}
                    </div>

                    {/* Enquiries */}
                    <div className="col-span-2 text-right font-medium text-xs text-[#191c1a]">
                      {item.enquiries}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Recent buyer activity (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs flex flex-col">
            <h2 className="font-serif text-xl font-bold text-[#191c1a] pb-4 border-b border-[#edeae2] mb-4">
              Recent buyer activity
            </h2>

            {recentActivity.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-[#8a938c] my-auto">
                <Clock className="w-7 h-7 mb-2 opacity-40 text-[#1a3a2a]" />
                <p className="text-xs text-[#5c645d] leading-relaxed">
                  No recent buyer activity yet. When students enquire about your listings, notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {recentActivity.map((act) => (
                  <div key={act.id} className="space-y-1.5 pb-3 border-b border-[#f5f3ee] last:border-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.type === 'completed'
                            ? 'bg-[#e5ede7] text-[#1a3a2a]'
                            : act.type === 'meetup_scheduled'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {act.type === 'new_enquiry'
                          ? 'New enquiry'
                          : act.type === 'requested'
                          ? 'Requested'
                          : act.type === 'meetup_scheduled'
                          ? 'Meetup scheduled'
                          : 'Completed'}
                      </span>
                      <span className="text-[10px] text-[#8a938c]">
                        {formatRelativeTime(act.created_at)}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-[#191c1a]">
                      {act.buyer_name}
                    </h4>

                    {act.snippet && (
                      <p className="text-[11px] text-[#5c645d] line-clamp-2 leading-relaxed">
                        {act.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
