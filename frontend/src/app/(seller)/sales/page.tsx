'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Transaction, SalesSummaryOut } from '@/types/transaction';
import { useAuth } from '@/hooks/useAuth';
import {
  CheckCircle2,
  Calendar,
  Filter,
  PackageCheck,
  TrendingUp,
  Receipt,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

function numberToWord(n: number): string {
  const words: { [key: number]: string } = {
    0: 'Zero',
    1: 'One',
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
    6: 'Six',
    7: 'Seven',
    8: 'Eight',
    9: 'Nine',
    10: 'Ten',
    11: 'Eleven',
    12: 'Twelve',
  };
  return words[n] || String(n);
}

export default function SalesHistoryPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sales, setSales] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SalesSummaryOut>({
    completed_sales: 0,
    total_earned_offline: 0,
    products_sold: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSales() {
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [historyData, summaryData] = await Promise.all([
          apiClient.get<Transaction[]>('/transactions/sales/history'),
          apiClient.get<SalesSummaryOut>('/transactions/sales/summary'),
        ]);
        setSales(historyData);
        setSummary(summaryData);
      } catch (err: any) {
        console.error('Failed to load sales history', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadSales();
    }
  }, [isAuthenticated, authLoading]);

  const formatPrice = (val?: string | number) => {
    if (val === undefined || val === null) return '₹ 0';
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
          <Receipt className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Seller Portal • Sales History
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6 leading-relaxed">
          Sign in with your campus credentials to view verified completed exchanges and offline earnings.
        </p>
        <Link
          href="/login?redirect=/sales"
          className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const completedCount = summary.completed_sales;
  const countWord = numberToWord(completedCount);
  const headingText =
    completedCount > 0
      ? `${countWord} finds, ${countWord.toLowerCase()} new chapters.`
      : 'Your campus sales journey begins.';

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Top Header - Strictly adhering to Screen s17 */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#191c1a] tracking-tight mb-2">
            {headingText}
          </h1>
          <p className="text-sm sm:text-base text-[#5c645d]">
            Your Sales History · Completed exchanges with your campus community.
          </p>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Completed Sales */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs">
            <span className="text-xs font-medium text-[#5c645d] block mb-4">
              Completed sales
            </span>
            <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a]">
              {summary.completed_sales}
            </div>
          </div>

          {/* Card 2: Total Earned Offline */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs">
            <span className="text-xs font-medium text-[#5c645d] block mb-4">
              Total earned offline
            </span>
            <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a]">
              {formatPrice(summary.total_earned_offline)}
            </div>
          </div>

          {/* Card 3: Products Sold */}
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs">
            <span className="text-xs font-medium text-[#5c645d] block mb-4">
              Products sold
            </span>
            <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1a3a2a]">
              {summary.products_sold}
            </div>
          </div>
        </div>

        {/* In-Person Payment Notice Box */}
        <div className="bg-[#eef3ef] border border-[#dce6df] rounded-2xl p-5 mb-8 flex items-start gap-3.5">
          <div className="w-5 h-5 rounded-full bg-[#1a3a2a] text-white flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-[#2d3a30] leading-relaxed">
            <span className="font-bold text-[#1a3a2a]">Paid in person. Recorded here. </span>
            These totals include only exchanges confirmed by both students. ReThread doesn't
            process payments, settlements or payouts. Requested, cancelled and disputed exchanges
            aren't earnings.
          </div>
        </div>

        {/* Table Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 gap-4">
          <h2 className="font-semibold text-sm sm:text-base text-[#191c1a]">
            All {completedCount} completed exchanges
          </h2>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#e2ded6] text-xs font-medium text-[#191c1a] flex items-center gap-2 shadow-xs cursor-default">
              <span>All time</span>
              <span className="text-[10px] text-[#8a938c]">▾</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#e2ded6] text-xs font-medium text-[#191c1a] flex items-center gap-2 shadow-xs cursor-default">
              <span>Status: Completed</span>
              <span className="text-[10px] text-[#8a938c]">▾</span>
            </div>
          </div>
        </div>

        {/* Exchanges Table */}
        {sales.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-12 text-center my-6 flex flex-col items-center justify-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#f5f3ee] border border-[#e2ded6] flex items-center justify-center text-[#5c645d] mb-4">
              <PackageCheck className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
              No Completed Exchanges Yet
            </h3>
            <p className="text-xs text-[#5c645d] max-w-sm mb-6 leading-relaxed">
              When a buyer requests an item and both of you confirm the physical handover on campus,
              the sale and offline cash/UPI payment record will appear here.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/enquiries"
                className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
              >
                Check Buyer Enquiries
              </Link>
              <Link
                href="/listings"
                className="px-5 py-2.5 rounded-xl border border-[#e2ded6] bg-white text-[#191c1a] text-xs font-semibold hover:bg-[#f5f3ee] transition shadow-xs"
              >
                Manage Listings
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#e2ded6] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#edf1ed] text-[11px] font-bold uppercase tracking-wider text-[#49544c] border-b border-[#e2ded6]">
                    <th className="py-4 px-6">PRODUCT</th>
                    <th className="py-4 px-6">BUYER</th>
                    <th className="py-4 px-6">AGREED PRICE</th>
                    <th className="py-4 px-6">COMPLETED ON</th>
                    <th className="py-4 px-6">TRANSACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeae2] text-xs text-[#191c1a]">
                  {sales.map((tx) => {
                    const product = tx.listing;
                    const buyerName = tx.buyer?.profile?.full_name || 'Campus Student';
                    const buyerInitials = buyerName.slice(0, 2).toUpperCase();

                    return (
                      <tr key={tx.id} className="hover:bg-[#faf9f6] transition">
                        {/* PRODUCT */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[#edeae2] overflow-hidden border border-[#e2ded6] shrink-0">
                              {product?.primary_image_url ? (
                                <img
                                  src={product.primary_image_url}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-[#8a938c]">
                                  No Photo
                                </div>
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/product/${product?.id || ''}`}
                                className="font-semibold text-sm text-[#191c1a] hover:text-[#1a3a2a] transition flex items-center gap-1 group"
                              >
                                <span>{product?.title || 'Pre-owned Item'}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-[#5c645d]" />
                              </Link>
                              <span className="text-[10px] text-[#5c645d] block mt-0.5">
                                {product?.category_name || 'Campus find'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* BUYER */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#1a3a2a] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {buyerInitials}
                            </div>
                            <span className="font-medium text-xs text-[#191c1a]">
                              {buyerName}
                            </span>
                          </div>
                        </td>

                        {/* AGREED PRICE */}
                        <td className="py-4 px-6 font-semibold text-sm text-[#191c1a]">
                          {formatPrice(product?.price)}
                        </td>

                        {/* COMPLETED ON */}
                        <td className="py-4 px-6 text-[#5c645d]">
                          {formatDate(tx.completed_at || tx.updated_at)}
                        </td>

                        {/* TRANSACTION PILL */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#e5ede7] text-[#1a3a2a]">
                            Completed
                          </span>
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
