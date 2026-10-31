'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { ListingDetail } from '@/types/marketplace';
import { SellerListingCounts } from '@/types/seller';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  Search,
  Tag,
  Eye,
  MessageSquare,
  Archive,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';

export default function MyListingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [counts, setCounts] = useState<SellerListingCounts>({
    all: 0,
    active: 0,
    draft: 0,
    reserved: 0,
    sold: 0,
    archived: 0,
  });
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadListingsAndCounts() {
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [listingsData, countsData] = await Promise.all([
          apiClient.get<ListingDetail[]>(`/seller/listings?status_filter=${activeTab}`),
          apiClient.get<SellerListingCounts>('/seller/listings/counts'),
        ]);
        setListings(listingsData);
        setCounts(countsData);
      } catch (err: any) {
        console.error('Failed to load seller listings', err);
        setFeedback({ msg: err.message || 'Failed to load your listings.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadListingsAndCounts();
    }
  }, [isAuthenticated, authLoading, activeTab]);

  const handleArchive = async (listingId: string) => {
    setActionInProgress(listingId);
    setFeedback(null);
    try {
      const updated = await apiClient.post<ListingDetail>(`/seller/listings/${listingId}/archive`);
      setListings((prev) => prev.map((l) => (l.id === listingId ? updated : l)));
      setCounts((prev) => ({
        ...prev,
        active: Math.max(0, prev.active - 1),
        archived: prev.archived + 1,
      }));
      setFeedback({ msg: 'Listing archived and hidden from discovery.', type: 'success' });
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Failed to archive listing.', type: 'error' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePublish = async (listingId: string) => {
    setActionInProgress(listingId);
    setFeedback(null);
    try {
      const updated = await apiClient.post<ListingDetail>(`/seller/listings/${listingId}/publish`);
      setListings((prev) => prev.map((l) => (l.id === listingId ? updated : l)));
      setCounts((prev) => ({
        ...prev,
        draft: Math.max(0, prev.draft - 1),
        active: prev.active + 1,
      }));
      setFeedback({ msg: 'Listing published to campus marketplace!', type: 'success' });
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Failed to publish listing.', type: 'error' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteDraft = async (listingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this draft listing?')) return;
    setActionInProgress(listingId);
    setFeedback(null);
    try {
      await apiClient.delete(`/seller/listings/${listingId}`);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setCounts((prev) => ({
        ...prev,
        all: Math.max(0, prev.all - 1),
        draft: Math.max(0, prev.draft - 1),
      }));
      setFeedback({ msg: 'Draft listing deleted.', type: 'success' });
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Failed to delete draft listing.', type: 'error' });
    } finally {
      setActionInProgress(null);
    }
  };

  const formatPrice = (val?: string | number) => {
    if (!val) return '₹ 0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.category?.name && l.category.name.toLowerCase().includes(q))
    );
  }, [listings, searchQuery]);

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
          <Tag className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Seller Portal • My Listings
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6 leading-relaxed">
          Log in with your college credentials to manage, edit, and track your active campus thrift inventory.
        </p>
        <Link
          href="/login?redirect=/listings"
          className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const tabOptions = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'draft', label: `Draft (${counts.draft})` },
    { key: 'reserved', label: `Reserved (${counts.reserved})` },
    { key: 'sold', label: `Sold (${counts.sold})` },
    { key: 'archived', label: `Archived (${counts.archived})` },
  ];

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Header - Strictly adhering to Figma Screen s12 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e2ded6] mb-6 gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191c1a] tracking-tight mb-1">
              My Listings
            </h1>
            <p className="text-xs sm:text-sm text-[#5c645d]">
              Keep track of everything you’ve listed on ReThread.
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

        {/* Global Feedback Alert */}
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

        {/* Status Filter Tabs adhering to Screen s12 */}
        <div className="flex items-center gap-6 overflow-x-auto pb-4 border-b border-[#e2ded6] mb-6 text-xs scrollbar-none">
          {tabOptions.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`font-semibold pb-1.5 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a]'
                  : 'text-[#5c645d] hover:text-[#1a3a2a]'
              }`}
            >
              {activeTab === tab.key && <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a2a]" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Subtitle & Search Bar Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 gap-4">
          <span className="text-xs text-[#5c645d]">
            Showing {filteredListings.length} of {counts.all} listings · Most recently updated
          </span>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8a938c] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#e2ded6] text-xs placeholder:text-[#8a938c] focus:outline-hidden focus:border-[#1a3a2a] shadow-xs"
            />
          </div>
        </div>

        {/* Listings Table adhering to Screen s12 */}
        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-12 text-center my-6 flex flex-col items-center justify-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#f5f3ee] border border-[#e2ded6] flex items-center justify-center text-[#5c645d] mb-4">
              <PackageCheck className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
              No Listings Found
            </h3>
            <p className="text-xs text-[#5c645d] max-w-sm mb-6 leading-relaxed">
              {searchQuery
                ? `No listings matched "${searchQuery}". Try searching for something else.`
                : activeTab === 'all'
                ? "You haven't created any listings yet. Start selling within your campus community today."
                : `You don't have any listings with "${activeTab}" status.`}
            </p>
            <Link
              href="/listings/create"
              className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
            >
              Create New Listing
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#e2ded6] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#edf1ed] text-[11px] font-bold uppercase tracking-wider text-[#49544c] border-b border-[#e2ded6]">
                    <th className="py-4 px-6">PRODUCT / CATEGORY</th>
                    <th className="py-4 px-6">PRICE</th>
                    <th className="py-4 px-6">VIEWS</th>
                    <th className="py-4 px-6">ENQUIRIES</th>
                    <th className="py-4 px-6">LISTED</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeae2] text-xs text-[#191c1a]">
                  {filteredListings.map((item) => {
                    const primaryImg = item.images && item.images.length > 0 ? item.images[0].image_url : null;
                    const isDraft = item.status === 'draft';
                    const isActive = item.status === 'active';
                    const isReserved = item.status === 'reserved';
                    const isSold = item.status === 'sold';
                    const isArchived = item.status === 'archived';

                    return (
                      <tr key={item.id} className="hover:bg-[#faf9f6] transition">
                        {/* PRODUCT / CATEGORY */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[#edeae2] overflow-hidden border border-[#e2ded6] shrink-0">
                              {primaryImg ? (
                                <img
                                  src={primaryImg}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-[#8a938c]">
                                  No Photo
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/product/${item.id}`}
                                className="font-semibold text-sm text-[#191c1a] hover:text-[#1a3a2a] truncate block transition"
                              >
                                {item.title}
                              </Link>
                              <span className="text-[10px] text-[#5c645d] block mt-0.5">
                                {item.category?.name || 'Campus Item'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* PRICE */}
                        <td className="py-4 px-6 font-semibold text-sm text-[#191c1a]">
                          {formatPrice(item.price)}
                        </td>

                        {/* VIEWS */}
                        <td className="py-4 px-6 text-[#5c645d]">
                          {item.view_count || 0}
                        </td>

                        {/* ENQUIRIES */}
                        <td className="py-4 px-6 text-[#5c645d]">
                          {item.enquiries_count || 0}
                        </td>

                        {/* LISTED */}
                        <td className="py-4 px-6 text-[#5c645d]">
                          {formatDate(item.published_at || item.created_at)}
                        </td>

                        {/* STATUS PILL */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-[#1a3a2a] text-white'
                                : isReserved
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : isSold
                                ? 'bg-[#e5ede7] text-[#1a3a2a]'
                                : isDraft
                                ? 'bg-stone-100 text-stone-600'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {isActive
                              ? 'Active'
                              : isReserved
                              ? 'Reserved'
                              : isSold
                              ? 'Sold'
                              : isDraft
                              ? 'Draft'
                              : 'Archived'}
                          </span>
                        </td>

                        {/* ACTIONS adhering to Screen s12 */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {isActive && (
                              <>
                                <Link
                                  href={`/product/${item.id}`}
                                  className="text-[#1a3a2a] font-semibold hover:underline"
                                >
                                  View
                                </Link>
                                <span className="text-stone-300">·</span>
                                <Link
                                  href="/enquiries"
                                  className="text-[#1a3a2a] font-semibold hover:underline"
                                >
                                  Manage Enquiries
                                </Link>
                                <span className="text-stone-300">·</span>
                                <button
                                  type="button"
                                  disabled={actionInProgress === item.id}
                                  onClick={() => handleArchive(item.id)}
                                  className="text-[#5c645d] hover:text-stone-900 hover:underline disabled:opacity-50"
                                >
                                  Archive
                                </button>
                              </>
                            )}

                            {isReserved && (
                              <>
                                <Link
                                  href={`/product/${item.id}`}
                                  className="text-[#1a3a2a] font-semibold hover:underline"
                                >
                                  View
                                </Link>
                                <span className="text-stone-300">·</span>
                                <Link
                                  href="/enquiries"
                                  className="text-[#1a3a2a] font-semibold hover:underline"
                                >
                                  Manage Enquiries
                                </Link>
                              </>
                            )}

                            {isDraft && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionInProgress === item.id}
                                  onClick={() => handlePublish(item.id)}
                                  className="text-[#1a3a2a] font-semibold hover:underline disabled:opacity-50"
                                >
                                  Publish
                                </button>
                                <span className="text-stone-300">·</span>
                                <button
                                  type="button"
                                  disabled={actionInProgress === item.id}
                                  onClick={() => handleDeleteDraft(item.id)}
                                  className="text-rose-600 font-semibold hover:underline disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </>
                            )}

                            {isSold && (
                              <Link
                                href="/sales"
                                className="text-[#1a3a2a] font-semibold hover:underline"
                              >
                                View in Sales History
                              </Link>
                            )}

                            {isArchived && (
                              <button
                                type="button"
                                disabled={actionInProgress === item.id}
                                onClick={() => handlePublish(item.id)}
                                className="text-[#1a3a2a] font-semibold hover:underline disabled:opacity-50"
                              >
                                Republish
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
