'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Category, ListingSummary, PaginatedListings } from '@/types/marketplace';
import { ProductGrid } from '@/components/products/ProductGrid';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  Laptop,
  BookOpen,
  Shirt,
  Footprints,
  Armchair,
  Dumbbell,
  Watch,
  Layers,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  electronics: <Laptop className="w-4 h-4" />,
  books: <BookOpen className="w-4 h-4" />,
  apparel: <Shirt className="w-4 h-4" />,
  footwear: <Footprints className="w-4 h-4" />,
  furniture: <Armchair className="w-4 h-4" />,
  sports: <Dumbbell className="w-4 h-4" />,
  accessories: <Watch className="w-4 h-4" />,
  other: <Layers className="w-4 h-4" />,
};

export default function DiscoverPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentListings, setRecentListings] = useState<ListingSummary[]>([]);
  const [trendingListings, setTrendingListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchDiscoverData() {
      try {
        setLoading(true);
        const [cats, listingsRes] = await Promise.all([
          apiClient.get<Category[]>('/categories'),
          apiClient.get<PaginatedListings>('/listings?limit=12'),
        ]);
        setCategories(cats);
        setRecentListings(listingsRes.items);
        // Take top 4 as trending
        setTrendingListings(listingsRes.items.slice(0, 4));
      } catch (err) {
        console.error('Failed to load discover page data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDiscoverData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a]">
      {/* Hero Section adhering to Screen s4 */}
      <section className="border-b border-[#e2ded6] bg-[#edeae2]/50 py-12 md:py-16">
        <div className="max-w-[1312px] mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f0eb] text-[#1a3a2a] text-xs font-semibold mb-4 border border-[#d8e5dc]">
              <Sparkles className="w-3.5 h-3.5" /> Campus Exclusive Thrift
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a3a2a] tracking-tight mb-4 leading-tight">
              Pre-owned collegiate gear, zero courier fees.
            </h1>
            <p className="text-[#5c645d] text-base md:text-lg mb-8 leading-relaxed">
              Buy and sell calculators, course textbooks, dorm essentials, and college thrift directly with verified students across campus hostels and departments.
            </p>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
              <input
                type="text"
                placeholder="Search calculators, physics notes, dorm desks, hoodies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-13 pl-12 pr-28 rounded-2xl border border-[#e2ded6] bg-white text-sm text-[#191c1a] placeholder:text-[#8a938c] shadow-sm focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition"
              />
              <Search className="w-5 h-5 text-[#8a938c] absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold transition"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Category Scroll Bar */}
      <section className="py-6 border-b border-[#e2ded6] bg-white">
        <div className="max-w-[1312px] mx-auto px-6">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <Link
              href="/explore"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#e8f0eb] text-[#1a3a2a] hover:bg-[#d8e5dc] transition shrink-0"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>All Items</span>
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#f5f3ee] text-[#5c645d] hover:text-[#1a3a2a] hover:bg-[#edeae2] transition shrink-0 border border-[#e2ded6]"
              >
                {CATEGORY_ICONS[cat.slug] || <Tag className="w-3.5 h-3.5" />}
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Discover Feed */}
      <div className="max-w-[1312px] mx-auto px-6 py-10 space-y-12">
        {/* Trending Section */}
        {trendingListings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#191c1a]">
                  Trending on Campus
                </h2>
                <p className="text-xs text-[#5c645d]">
                  Most viewed thrift essentials this semester
                </p>
              </div>
              <Link
                href="/explore?sort=recent"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a2a] hover:underline"
              >
                <span>View all</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ProductGrid products={trendingListings} loading={loading} />
          </section>
        )}

        {/* Recently Listed Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#191c1a]">
                Recently Listed
              </h2>
              <p className="text-xs text-[#5c645d]">
                Freshly uploaded items from fellow campus students
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a2a] hover:underline"
            >
              <span>Explore all items</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ProductGrid products={recentListings} loading={loading} />
        </section>

        {/* Campus Meetup Guarantee Banner */}
        <section className="rounded-3xl bg-[#1a3a2a] text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
              <ShieldCheck className="w-4 h-4" /> 100% Student-Exclusive
            </div>
            <h3 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              Have unused textbooks or gear in your dorm?
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed">
              Clear your room, earn in cash during meetup, and help a junior. List your pre-owned item in less than two minutes.
            </p>
          </div>
          <Link
            href="/listings/create"
            className="px-6 py-3 rounded-xl bg-white text-[#1a3a2a] hover:bg-[#e8f0eb] font-semibold text-sm transition shadow-sm shrink-0"
          >
            Create a Listing
          </Link>
        </section>
      </div>
    </div>
  );
}
