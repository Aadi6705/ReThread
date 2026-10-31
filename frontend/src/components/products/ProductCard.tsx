'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListingSummary } from '@/types/marketplace';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { Heart, ShieldCheck, Tag } from 'lucide-react';

interface ProductCardProps {
  product: ListingSummary;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onWishlistToggle,
  isWishlisted = false,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹ ${num.toLocaleString('en-IN')}`;
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'like_new':
        return 'Like New';
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      default:
        return condition;
    }
  };

  const getConditionBadgeStyle = (condition: string) => {
    switch (condition) {
      case 'like_new':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'excellent':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'good':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=/product/${product.id}`);
      return;
    }

    const nextState = !wishlisted;
    setWishlisted(nextState);

    if (onWishlistToggle) {
      onWishlistToggle(product.id);
      return;
    }

    try {
      if (nextState) {
        await apiClient.post(`/wishlist/${product.id}`);
      } else {
        await apiClient.delete(`/wishlist/${product.id}`);
      }
    } catch (err: any) {
      // Revert optimistic state on error
      setWishlisted(!nextState);
    }
  };

  // Calculate discount percentage if original price exists
  const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const origNum =
    product.original_price != null
      ? typeof product.original_price === 'string'
        ? parseFloat(product.original_price)
        : product.original_price
      : null;

  const discountPercent =
    origNum && origNum > priceNum
      ? Math.round(((origNum - priceNum) / origNum) * 100)
      : null;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative bg-white rounded-2xl border border-[#e2ded6] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:border-[#1a3a2a]/30"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full bg-[#edeae2] overflow-hidden">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8a938c]">
            <Tag className="w-8 h-8 mb-1" />
            <span className="text-xs">No Photo</span>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-xs backdrop-blur-xs ${getConditionBadgeStyle(
              product.condition
            )}`}
          >
            {getConditionLabel(product.condition)}
          </span>
        </div>

        {/* Floating Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all ${
            wishlisted
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/80 text-[#5c645d] hover:bg-white hover:text-rose-600'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Status Overlay if not active */}
        {product.status !== 'active' && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-white text-[#191c1a] shadow-sm">
              {product.status}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chip & Campus */}
          <div className="flex items-center justify-between text-[11px] text-[#5c645d] mb-1">
            <span className="font-medium text-[#1a3a2a]">{product.category_name}</span>
            <span className="truncate max-w-[130px]">{product.campus_name}</span>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-sm text-[#191c1a] line-clamp-2 leading-snug group-hover:text-[#1a3a2a] transition-colors mb-2">
            {product.title}
          </h3>
        </div>

        {/* Pricing and Seller Verified Info */}
        <div className="pt-2 border-t border-[#edeae2]/60 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base text-[#191c1a]">
              {formatPrice(product.price)}
            </span>
            {origNum && origNum > priceNum && (
              <span className="text-xs text-[#8a938c] line-through">
                {formatPrice(origNum)}
              </span>
            )}
            {discountPercent && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {product.seller_is_verified && (
            <div
              className="flex items-center gap-1 text-[11px] font-medium text-[#1a3a2a]"
              title="Verified Campus Student"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
