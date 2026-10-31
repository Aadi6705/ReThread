'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { useModeStore } from '@/store/useModeStore';
import { useAuth } from '@/hooks/useAuth';
import { ModeSwitcher } from '@/components/navigation/ModeSwitcher';
import { Header } from '@/components/navigation/Header';
import { ListingSummary, PaginatedListings } from '@/types/marketplace';
import { ProductGrid } from '@/components/products/ProductGrid';
import {
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  ArrowRight,
  Compass,
  Heart,
  MessageSquare,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Building,
  GraduationCap,
  Package,
} from 'lucide-react';

interface HealthData {
  status: string;
  app_name: string;
  environment: string;
  database: string;
  timestamp: string;
  version: string;
}

export default function HomePage() {
  const { mode } = useModeStore();
  const { user, isAuthenticated, logout } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [featuredListings, setFeaturedListings] = useState<ListingSummary[]>([]);
  const [loadingListings, setLoadingListings] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [healthRes, listingsRes] = await Promise.all([
          apiClient.get<HealthData>('/health'),
          apiClient.get<PaginatedListings>('/listings?limit=8'),
        ]);
        setHealth(healthRes);
        setFeaturedListings(listingsRes.items);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingListings(false);
      }
    }

    loadData();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] flex flex-col">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1312px] w-full mx-auto px-6 py-10 space-y-12">
        {/* User Welcome Banner if Logged In */}
        {isAuthenticated && user && (
          <div className="p-6 rounded-2xl bg-white border border-[#e2ded6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e8f0eb] border border-[#d8e5dc] flex items-center justify-center text-[#1a3a2a] font-bold text-base shrink-0">
                {getInitials(user.profile?.full_name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-[#191c1a]">
                    Welcome, {user.profile?.full_name}!
                  </h3>
                  {user.is_email_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Student
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#5c645d]">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> {user.college?.name}
                  </span>
                  {user.profile?.department && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> {user.profile.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/listings/create"
                className="px-4 py-2 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Listing</span>
              </Link>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#e2ded6]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f0eb] text-[#1a3a2a] text-xs font-semibold mb-3 border border-[#d8e5dc]">
              <Sparkles className="w-3.5 h-3.5" /> Phase 3 Marketplace Live
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#1a3a2a] tracking-tight mb-3">
              Campus Thrift & Pre-Owned Essentials
            </h1>
            <p className="text-[#5c645d] text-base leading-relaxed">
              Scientific calculators, engineering notes, winter hoodies, study furniture, and sneakers. Exclusively for college students with zero delivery charges.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/discover"
              className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Open Discover Hub</span>
            </Link>
            <Link
              href="/explore"
              className="px-5 py-2.5 rounded-xl border border-[#1a3a2a] text-[#1a3a2a] text-xs font-semibold hover:bg-[#e8f0eb] transition"
            >
              Search & Filters
            </Link>
          </div>
        </div>

        {/* Live Marketplace Catalogue Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#191c1a]">
                Live Campus Listings
              </h2>
              <p className="text-xs text-[#5c645d]">
                Authentic items listed by students on campus in INR (₹)
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a2a] hover:underline"
            >
              <span>Explore all {featuredListings.length} items</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ProductGrid products={featuredListings} loading={loadingListings} />
        </section>

        {/* Phase 3 Deliverables Checklist Card */}
        <div className="bg-white rounded-3xl border border-[#e2ded6] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1a3a2a]">
                Phase 3 Marketplace & Product Listings Deliverables
              </h3>
              <p className="text-xs text-[#5c645d] mt-1">
                Connected end-to-end with persistent PostgreSQL database and FastAPI backend.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              PHASE 3 ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-[#edeae2]">
            {[
              { label: 'Category API (GET /api/v1/categories) with 8 active categories', done: true },
              { label: 'Marketplace Search & Faceted Filter API (GET /api/v1/listings)', done: true },
              { label: 'Product Detail API (GET /api/v1/listings/{id}) with seller & multi-image gallery', done: true },
              { label: 'Cloudinary Image Upload with 5MB limit & 5-photo enforcement', done: true },
              { label: 'Seller Listing CRUD API (POST, PATCH, DELETE, PUBLISH, ARCHIVE)', done: true },
              { label: 'Discover Hub (/discover) adhering to Figma design s4', done: true },
              { label: 'Explore & Faceted Search (/explore) adhering to Figma design s5', done: true },
              { label: 'Product Details view (/product/[id]) adhering to Figma design s6', done: true },
              { label: '4-Step Seller Wizard (/listings/create) adhering to s13, s14, s15', done: true },
              { label: 'Automated Pytest Suite passing with 7/7 tests', done: true },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f3ee] border border-[#e2ded6]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#1a3a2a] shrink-0" />
                <span className="text-xs font-semibold text-[#191c1a]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2ded6] bg-[#f5f3ee] py-6 text-center text-xs text-[#8a938c]">
        ReThread Campus Marketplace &copy; 2026. Strictly offline university campus transactions.
      </footer>
    </div>
  );
}
