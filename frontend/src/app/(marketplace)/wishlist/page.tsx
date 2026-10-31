'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { WishlistItem } from '@/types/transaction';
import { useAuth } from '@/hooks/useAuth';
import {
  Heart,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  PackageOpen,
} from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWishlist() {
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiClient.get<WishlistItem[]>('/wishlist');
        setItems(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load wishlist.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchWishlist();
    }
  }, [isAuthenticated, authLoading]);

  const handleRemove = async (listingId: string) => {
    try {
      await apiClient.delete(`/wishlist/${listingId}`);
      setItems((prev) => prev.filter((item) => item.listing_id !== listingId));
    } catch (err: any) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹ ${num.toLocaleString('en-IN')}`;
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
          <Heart className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Your Saved Items
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6 leading-relaxed">
          Log in with your verified campus email to save and track listings for offline meetup.
        </p>
        <Link
          href="/login?redirect=/wishlist"
          className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
        >
          Sign In to View Wishlist
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Header adhering to Screen s7 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e2ded6] mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-serif text-3xl font-bold text-[#1a3a2a]">
                Saved Items
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8f0eb] text-[#1a3a2a] border border-[#d8e5dc]">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-[#5c645d]">
              Track item availability in real-time before requesting a campus meetup
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs font-semibold text-[#1a3a2a] hover:underline self-start sm:self-auto"
          >
            Explore more campus items &rarr;
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-rose-800">{error}</p>
          </div>
        )}

        {/* Wishlist Grid */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-12 text-center my-6 flex flex-col items-center justify-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#f5f3ee] border border-[#e2ded6] flex items-center justify-center text-[#5c645d] mb-4">
              <PackageOpen className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-[#5c645d] max-w-sm mb-6 leading-relaxed">
              Explore calculators, course textbooks, college hoodies, and dorm gear to save items for future meetup coordination.
            </p>
            <Link
              href="/explore"
              className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm flex items-center gap-1.5"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const product = item.listing;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#e2ded6] overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all group"
                >
                  {/* Thumbnail & Badges */}
                  <div className="relative aspect-[4/3] bg-[#edeae2] overflow-hidden">
                    {product.primary_image_url ? (
                      <img
                        src={product.primary_image_url}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#8a938c]">
                        No Photo
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                          product.status === 'active'
                            ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
                            : product.status === 'reserved'
                            ? 'bg-amber-50/90 text-amber-800 border-amber-200'
                            : 'bg-stone-50/90 text-stone-700 border-stone-200'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>

                    {/* Delete / Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 text-[#8a938c] hover:text-rose-600 hover:bg-white transition backdrop-blur-md shadow-xs"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#1a3a2a] mb-1">
                        {product.category_name}
                      </div>
                      <Link
                        href={`/product/${product.id}`}
                        className="font-semibold text-sm text-[#191c1a] line-clamp-2 hover:text-[#1a3a2a] transition mb-2"
                      >
                        {product.title}
                      </Link>
                    </div>

                    <div className="pt-3 border-t border-[#edeae2] flex items-center justify-between">
                      <span className="font-bold text-base text-[#1a3a2a]">
                        {formatPrice(product.price)}
                      </span>

                      <Link
                        href={`/product/${product.id}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          product.status === 'active'
                            ? 'bg-[#1a3a2a] text-white hover:bg-[#132c1f]'
                            : 'bg-[#f5f3ee] text-[#5c645d] border border-[#e2ded6]'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{product.status === 'active' ? 'Buy Request' : 'View'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
