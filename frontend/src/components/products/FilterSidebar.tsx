'use client';

import React from 'react';
import { Category } from '@/types/marketplace';
import { RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  selectedCondition: string;
  onSelectCondition: (condition: string) => void;
  onReset: () => void;
}

const CONDITIONS = [
  { value: 'all', label: 'All Conditions' },
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  selectedCondition,
  onSelectCondition,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#e2ded6] p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#edeae2]">
        <h3 className="font-serif text-lg font-bold text-[#191c1a]">Filters</h3>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-[#5c645d] hover:text-[#1a3a2a] transition font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-3">
          Category
        </label>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === 'all' || !selectedCategory
                ? 'bg-[#e8f0eb] text-[#1a3a2a]'
                : 'text-[#5c645d] hover:bg-[#f5f3ee]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat.slug
                  ? 'bg-[#e8f0eb] text-[#1a3a2a]'
                  : 'text-[#5c645d] hover:bg-[#f5f3ee]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range (INR) */}
      <div className="pt-4 border-t border-[#edeae2]">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-3">
          Price Range (₹ INR)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-[#8a938c] font-medium mb-1 block">Min (₹)</span>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] focus:outline-none focus:border-[#1a3a2a]"
            />
          </div>
          <div>
            <span className="text-[10px] text-[#8a938c] font-medium mb-1 block">Max (₹)</span>
            <input
              type="number"
              placeholder="10000"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] focus:outline-none focus:border-[#1a3a2a]"
            />
          </div>
        </div>
      </div>

      {/* Condition Pills */}
      <div className="pt-4 border-t border-[#edeae2]">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-3">
          Condition
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onSelectCondition(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                selectedCondition === c.value
                  ? 'bg-[#1a3a2a] text-white border-[#1a3a2a]'
                  : 'bg-[#fdfdfc] text-[#5c645d] border-[#e2ded6] hover:border-[#1a3a2a]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
