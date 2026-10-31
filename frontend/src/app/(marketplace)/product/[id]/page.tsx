'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { ListingDetail } from '@/types/marketplace';
import { useAuth } from '@/hooks/useAuth';
import {
  Heart,
  ShieldCheck,
  MapPin,
  Building,
  GraduationCap,
  MessageSquare,
  ShoppingBag,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Tag,
  CheckCircle2,
  Loader2,
  Lock,
} from 'lucide-react';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);

  // Request to buy modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListingDetail() {
      try {
        setLoading(true);
        const data = await apiClient.get<ListingDetail>(`/listings/${listingId}`);
        setListing(data);
      } catch (err: any) {
        setError(err.message || 'Product listing not found or is no longer available.');
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      fetchListingDetail();
    }
  }, [listingId]);

  useEffect(() => {
    async function checkWishlist() {
      if (!isAuthenticated || !listingId) return;
      try {
        const res = await apiClient.get<{ is_wishlisted: boolean }>(`/wishlist/check/${listingId}`);
        setWishlisted(res.is_wishlisted);
      } catch {
        // guest or error
      }
    }
    checkWishlist();
  }, [isAuthenticated, listingId]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/product/${listingId}`);
      return;
    }
    const next = !wishlisted;
    setWishlisted(next);
    try {
      if (next) {
        await apiClient.post(`/wishlist/${listingId}`);
      } else {
        await apiClient.delete(`/wishlist/${listingId}`);
      }
    } catch (err: any) {
      setWishlisted(!next);
      alert(err.message || 'Failed to update wishlist.');
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹ ${num.toLocaleString('en-IN')}`;
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'like_new':
        return 'Like New — Flawless condition, virtually unused';
      case 'excellent':
        return 'Excellent — Very minor signs of handling, fully functional';
      case 'good':
        return 'Good — Normal campus wear, works properly';
      case 'fair':
        return 'Fair — Noticeable wear or markings, fully operational';
      default:
        return condition;
    }
  };

  const handleSendPurchaseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=/product/${listingId}`);
      return;
    }

    setRequestSubmitting(true);
    setRequestError(null);
    try {
      await apiClient.post('/transactions', {
        listing_id: listingId,
        buyer_message: requestMessage.trim() || null,
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setRequestModalOpen(false);
        setRequestSuccess(false);
      }, 2500);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit purchase request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Listing Unavailable
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6">
          {error || 'This listing does not exist or may have been sold.'}
        </p>
        <Link
          href="/explore"
          className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold"
        >
          Browse Other Listings
        </Link>
      </div>
    );
  }

  const priceNum = typeof listing.price === 'string' ? parseFloat(listing.price) : listing.price;
  const origNum =
    listing.original_price != null
      ? typeof listing.original_price === 'string'
        ? parseFloat(listing.original_price)
        : listing.original_price
      : null;

  const discountPercent =
    origNum && origNum > priceNum
      ? Math.round(((origNum - priceNum) / origNum) * 100)
      : null;

  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] pb-16">
      {/* Breadcrumb Header */}
      <div className="border-b border-[#e2ded6] bg-white py-3">
        <div className="max-w-[1312px] mx-auto px-6 flex items-center justify-between text-xs text-[#5c645d]">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 hover:text-[#1a3a2a] font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to catalog</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/" className="hover:text-[#1a3a2a]">
              Campus
            </Link>
            <span>/</span>
            <Link href={`/explore?category=${listing.category.slug}`} className="hover:text-[#1a3a2a]">
              {listing.category.name}
            </Link>
            <span>/</span>
            <span className="text-[#191c1a] truncate max-w-[200px]">{listing.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1312px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Image Gallery (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-[4/3] w-full rounded-3xl bg-white border border-[#e2ded6] overflow-hidden shadow-xs">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[activeImageIndex]?.image_url}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#8a938c]">
                  <Tag className="w-12 h-12 mb-2" />
                  <span className="text-sm">No photo available</span>
                </div>
              )}

              {/* Status Pill Badge */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#1a3a2a] border border-[#e2ded6] shadow-xs">
                  {listing.status}
                </span>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all shadow-xs ${
                  wishlisted
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-white/90 text-[#5c645d] hover:text-rose-600'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Navigation */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {listing.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-[#1a3a2a] ring-2 ring-[#1a3a2a]/20 shadow-xs'
                        : 'border-[#e2ded6] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-[#e2ded6] p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#191c1a]">
                Product Description
              </h3>
              <p className="text-sm text-[#5c645d] whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>

              {/* Details breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#edeae2] text-xs">
                <div>
                  <span className="text-[#8a938c] block">Category</span>
                  <span className="font-semibold text-[#191c1a]">{listing.category.name}</span>
                </div>
                {listing.brand && (
                  <div>
                    <span className="text-[#8a938c] block">Brand</span>
                    <span className="font-semibold text-[#191c1a]">{listing.brand}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#8a938c] block">Campus Meetup</span>
                  <span className="font-semibold text-[#191c1a]">{listing.college.campus_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Seller & Actions (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Main Action Panel */}
            <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 md:p-8 shadow-sm space-y-6">
              {/* Title & Category */}
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0eb] text-[#1a3a2a] mb-2">
                  {listing.category.name}
                </span>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#191c1a] leading-tight mb-2">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-[#5c645d]">
                  <MapPin className="w-3.5 h-3.5 text-[#1a3a2a]" />
                  <span>{listing.college.name} ({listing.college.campus_name})</span>
                </div>
              </div>

              {/* Pricing in INR */}
              <div className="p-4 rounded-2xl bg-[#f5f3ee] border border-[#e2ded6]">
                <span className="text-xs text-[#8a938c] font-medium block mb-1">
                  Selling Price (Campus In-Person Meetup)
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-3xl text-[#1a3a2a]">
                    {formatPrice(listing.price)}
                  </span>
                  {origNum && origNum > priceNum && (
                    <span className="text-sm text-[#8a938c] line-through font-medium">
                      {formatPrice(origNum)}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Condition Note */}
              <div className="p-3.5 rounded-xl bg-white border border-[#e2ded6]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5c645d] block mb-1">
                  Item Condition
                </span>
                <p className="text-xs text-[#191c1a] font-medium leading-relaxed">
                  {getConditionLabel(listing.condition)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {isOwner ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center font-medium">
                    This is your active listing. You can manage or edit it in Sell Mode.
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setRequestModalOpen(true)}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-sm font-semibold shadow-sm transition"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Request to Buy (Campus Meetup)</span>
                    </button>

                    <Link
                      href={`/messages?listing=${listing.id}`}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl border border-[#1a3a2a] text-[#1a3a2a] hover:bg-[#e8f0eb] text-sm font-semibold transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message Seller</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Strictly Offline Meetup Security Notice */}
              <div className="pt-4 border-t border-[#edeae2] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#1a3a2a] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#5c645d] leading-relaxed">
                  <strong className="text-[#191c1a]">Campus Meetup Model:</strong> No online payments or courier deliveries. Inspect the item in person before completing exchange.
                </p>
              </div>
            </div>

            {/* Seller Profile Card */}
            <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#191c1a]">
                Seller Information
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#e8f0eb] border border-[#d8e5dc] flex items-center justify-center text-[#1a3a2a] font-bold text-base shrink-0">
                  {listing.seller.profile?.full_name?.slice(0, 2).toUpperCase() || 'ST'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#191c1a]">
                      {listing.seller.profile?.full_name || 'Campus Student'}
                    </h4>
                    {listing.seller.is_email_verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#5c645d] mt-0.5">
                    {listing.seller.profile?.department && (
                      <span>{listing.seller.profile.department}</span>
                    )}
                    {listing.seller.profile?.academic_year && (
                      <span> • {listing.seller.profile.academic_year}</span>
                    )}
                  </div>
                </div>
              </div>

              {listing.seller.profile?.bio && (
                <p className="text-xs text-[#5c645d] italic bg-[#f5f3ee] p-3 rounded-xl border border-[#e2ded6]">
                  "{listing.seller.profile.bio}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#1a3a2a]">
              Send Purchase Request
            </h3>
            <p className="text-xs text-[#5c645d] leading-relaxed">
              Express your intent to purchase <span className="font-semibold text-[#191c1a]">{listing.title}</span> for <span className="font-semibold text-[#1a3a2a]">{formatPrice(listing.price)}</span>.
            </p>

            {requestSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-[#191c1a] mb-1">
                  Request Dispatched!
                </h4>
                <p className="text-xs text-[#5c645d]">
                  The seller has been notified and can accept to reserve this item for campus meetup.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendPurchaseRequest} className="space-y-4">
                {requestError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-800 font-medium">{requestError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-1.5">
                    Optional Note for Seller (e.g. Preferred Meetup Landmark)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Hi, I am interested! Can we meet at Student Activity Centre tomorrow after 4 PM?"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] focus:outline-none focus:border-[#1a3a2a]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#e2ded6] text-xs font-semibold text-[#5c645d] hover:bg-[#f5f3ee]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {requestSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Confirm Request</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
