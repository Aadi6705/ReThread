'use client';

import React from 'react';
import { ListingSummary } from '@/types/marketplace';
import { ProductCard } from './ProductCard';
import { PackageOpen } from 'lucide-react';

interface ProductGridProps {
  products: ListingSummary[];
  loading?: boolean;
  emptyMessage?: string;
  onResetFilters?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  emptyMessage = 'No thrift listings found matching your criteria.',
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#e2ded6] overflow-hidden animate-pulse flex flex-col"
          >
            <div className="aspect-[4/3] bg-[#edeae2] w-full" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-[#edeae2] rounded-full w-1/3" />
              <div className="h-4 bg-[#edeae2] rounded-full w-4/5" />
              <div className="h-4 bg-[#edeae2] rounded-full w-2/5 pt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2ded6] p-12 text-center my-6 flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f3ee] border border-[#e2ded6] flex items-center justify-center text-[#5c645d] mb-4">
          <PackageOpen className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
          No Products Found
        </h3>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6 leading-relaxed">
          {emptyMessage}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
          >
            Clear Active Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
