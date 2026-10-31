'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Category, ListingSummary, PaginatedListings } from '@/types/marketplace';
import { ProductGrid } from '@/components/products/ProductGrid';
import { FilterSidebar } from '@/components/products/FilterSidebar';
import { Search, X, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters from URL
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';
  const initialSort = searchParams.get('sort') || 'recent';
  const initialCondition = searchParams.get('condition') || 'all';
  const initialMinPrice = searchParams.get('min_price') || '';
  const initialMaxPrice = searchParams.get('max_price') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ListingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter local states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortOrder, setSortOrder] = useState(initialSort);
  const [selectedCondition, setSelectedCondition] = useState(initialCondition);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await apiClient.get<Category[]>('/categories');
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch products whenever filters or page change
  useEffect(() => {
    async function fetchFilteredProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        }
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim());
        }
        if (selectedCondition && selectedCondition !== 'all') {
          params.set('condition', selectedCondition);
        }
        if (minPrice) {
          params.set('min_price', minPrice);
        }
        if (maxPrice) {
          params.set('max_price', maxPrice);
        }
        if (sortOrder) {
          params.set('sort', sortOrder);
        }
        params.set('page', currentPage.toString());
        params.set('limit', '12');

        const res = await apiClient.get<PaginatedListings>(`/listings?${params.toString()}`);
        setProducts(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err) {
        console.error('Failed to fetch filtered products', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredProducts();
  }, [selectedCategory, searchQuery, sortOrder, selectedCondition, minPrice, maxPrice, currentPage]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortOrder('recent');
    setSelectedCondition('all');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a]">
      {/* Top Search & Filter Bar */}
      <div className="border-b border-[#e2ded6] bg-white py-4 sticky top-18 z-40">
        <div className="max-w-[1312px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search campus thrift..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-xs text-[#191c1a] placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a]"
            />
            <Search className="w-4 h-4 text-[#8a938c] absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a938c] hover:text-[#191c1a]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Controls: Mobile filter toggle & Sort Dropdown */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-xs font-semibold text-[#1a3a2a]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#5c645d] hidden sm:inline">Sort by:</span>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-xs font-medium text-[#191c1a] focus:outline-none focus:border-[#1a3a2a]"
              >
                <option value="recent">Recently Listed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1312px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <FilterSidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(slug) => {
                setSelectedCategory(slug);
                setCurrentPage(1);
              }}
              minPrice={minPrice}
              onMinPriceChange={(val) => {
                setMinPrice(val);
                setCurrentPage(1);
              }}
              maxPrice={maxPrice}
              onMaxPriceChange={(val) => {
                setMaxPrice(val);
                setCurrentPage(1);
              }}
              selectedCondition={selectedCondition}
              onSelectCondition={(c) => {
                setSelectedCondition(c);
                setCurrentPage(1);
              }}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Mobile Filter Drawer Overlay */}
          {mobileFilterOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex justify-end">
              <div className="w-80 h-full bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-bold">Filters</h3>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-full text-[#8a938c]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(slug) => {
                    setSelectedCategory(slug);
                    setCurrentPage(1);
                  }}
                  minPrice={minPrice}
                  onMinPriceChange={setMinPrice}
                  maxPrice={maxPrice}
                  onMaxPriceChange={setMaxPrice}
                  selectedCondition={selectedCondition}
                  onSelectCondition={setSelectedCondition}
                  onReset={handleResetFilters}
                />
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full mt-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Product Feed Area */}
          <main className="flex-1">
            {/* Results metadata */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#5c645d]">
                Showing <span className="font-semibold text-[#191c1a]">{products.length}</span> of{' '}
                <span className="font-semibold text-[#191c1a]">{total}</span> campus listings
              </p>

              {/* Active Filter Chips */}
              {(selectedCategory !== 'all' || selectedCondition !== 'all' || searchQuery || minPrice || maxPrice) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#8a938c]">Active:</span>
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#e8f0eb] text-[#1a3a2a]">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedCondition !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#e8f0eb] text-[#1a3a2a]">
                      {selectedCondition}
                      <button onClick={() => setSelectedCondition('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product Grid */}
            <ProductGrid
              products={products}
              loading={loading}
              onResetFilters={handleResetFilters}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-2 rounded-xl border border-[#e2ded6] bg-white text-[#191c1a] disabled:opacity-40 hover:bg-[#edeae2] transition"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-xs font-semibold transition ${
                      currentPage === i + 1
                        ? 'bg-[#1a3a2a] text-white shadow-sm'
                        : 'border border-[#e2ded6] bg-white text-[#5c645d] hover:bg-[#edeae2]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-2 rounded-xl border border-[#e2ded6] bg-white text-[#191c1a] disabled:opacity-40 hover:bg-[#edeae2] transition"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
