'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Transaction } from '@/types/transaction';
import { useAuth } from '@/hooks/useAuth';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Building,
  GraduationCap,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

export default function EnquiriesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [enquiries, setEnquiries] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadEnquiries() {
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiClient.get<Transaction[]>(
          `/transactions/seller?status_filter=${statusFilter}`
        );
        setEnquiries(data);
      } catch (err: any) {
        console.error('Failed to load enquiries', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadEnquiries();
    }
  }, [isAuthenticated, authLoading, statusFilter]);

  const handleAccept = async (txId: string) => {
    setActionInProgress(txId);
    setFeedback(null);
    try {
      const updated = await apiClient.post<Transaction>(`/transactions/${txId}/accept`);
      setEnquiries((prev) =>
        prev.map((item) => (item.id === txId ? updated : item))
      );
      setFeedback({
        msg: 'Purchase request accepted! The listing is now reserved for your campus meetup.',
        type: 'success',
      });
    } catch (err: any) {
      setFeedback({
        msg: err.message || 'Failed to accept purchase request.',
        type: 'error',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (txId: string) => {
    setActionInProgress(txId);
    setFeedback(null);
    try {
      const updated = await apiClient.post<Transaction>(`/transactions/${txId}/reject`);
      setEnquiries((prev) =>
        prev.map((item) => (item.id === txId ? updated : item))
      );
      setFeedback({
        msg: 'Purchase request declined.',
        type: 'success',
      });
    } catch (err: any) {
      setFeedback({
        msg: err.message || 'Failed to decline request.',
        type: 'error',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const formatPrice = (val?: string | number) => {
    if (!val) return '';
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
          <Inbox className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Seller Portal • Buyer Enquiries
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6 leading-relaxed">
          Log in with your verified college email to view and respond to incoming purchase requests.
        </p>
        <Link
          href="/login?redirect=/enquiries"
          className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
        >
          Sign In to View Enquiries
        </Link>
      </div>
    );
  }

  const pendingCount = enquiries.filter((e) => e.status === 'requested').length;

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Header adhering to Screen s16 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e2ded6] mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a3a2a] block mb-1">
              Seller Portal
            </span>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold text-[#1a3a2a]">
                Buyer Enquiries
              </h1>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-[#5c645d] mt-1">
              Incoming purchase requests and meetup coordination for your campus listings
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#edeae2] border border-[#e2ded6] self-start sm:self-auto text-xs">
            {[
              { val: 'all', label: 'All Requests' },
              { val: 'requested', label: 'Pending' },
              { val: 'accepted', label: 'Accepted / Reserved' },
              { val: 'rejected', label: 'Declined' },
            ].map((tab) => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setStatusFilter(tab.val)}
                className={`px-3 py-1.5 rounded-full font-semibold transition ${
                  statusFilter === tab.val
                    ? 'bg-white text-[#1a3a2a] shadow-xs'
                    : 'text-[#5c645d] hover:text-[#1a3a2a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
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

        {/* Enquiries Feed */}
        {enquiries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e2ded6] p-12 text-center my-6 flex flex-col items-center justify-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#f5f3ee] border border-[#e2ded6] flex items-center justify-center text-[#5c645d] mb-4">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
              No Buyer Enquiries
            </h3>
            <p className="text-xs text-[#5c645d] max-w-sm mb-6 leading-relaxed">
              When students send a purchase request for your items, they will appear here with their preferred campus meetup details.
            </p>
            <Link
              href="/listings/create"
              className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
            >
              List Another Item
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enquiries.map((tx) => {
              const product = tx.listing;
              const isPending = tx.status === 'requested';
              const isAccepted = tx.status === 'accepted';
              const isRejected = tx.status === 'rejected';

              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs hover:shadow-sm transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left: Product Thumbnail & Title */}
                  <div className="flex items-start gap-4 min-w-[280px]">
                    <div className="w-20 h-20 rounded-2xl bg-[#edeae2] overflow-hidden border border-[#e2ded6] shrink-0">
                      {product?.primary_image_url ? (
                        <img
                          src={product.primary_image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#8a938c]">
                          No Photo
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a3a2a] block mb-1">
                        {product?.category_name || 'Listing'}
                      </span>
                      <h4 className="font-semibold text-sm text-[#191c1a] line-clamp-1 mb-1">
                        {product?.title || 'Pre-owned Item'}
                      </h4>
                      <div className="font-bold text-base text-[#1a3a2a]">
                        {formatPrice(product?.price)}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Buyer Information & Note */}
                  <div className="flex-1 border-t md:border-t-0 md:border-l border-[#edeae2] pt-4 md:pt-0 md:pl-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1a3a2a] text-white flex items-center justify-center text-[11px] font-bold">
                        {tx.buyer?.profile?.full_name?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <span className="font-semibold text-xs text-[#191c1a]">
                        {tx.buyer?.profile?.full_name || 'Student Buyer'}
                      </span>
                      {tx.buyer?.is_email_verified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      )}
                    </div>

                    {tx.buyer_message ? (
                      <p className="text-xs text-[#5c645d] bg-[#f5f3ee] p-3 rounded-xl border border-[#e2ded6]">
                        "{tx.buyer_message}"
                      </p>
                    ) : (
                      <p className="text-xs text-[#8a938c] italic">
                        No additional meetup note provided by buyer.
                      </p>
                    )}

                    <div className="text-[10px] text-[#8a938c] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Requested on {new Date(tx.requested_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right: Actions or Status Badges */}
                  <div className="border-t md:border-t-0 md:border-l border-[#edeae2] pt-4 md:pt-0 md:pl-6 shrink-0 flex flex-col gap-2 w-full md:w-auto">
                    {isPending ? (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          disabled={actionInProgress === tx.id}
                          onClick={() => handleAccept(tx.id)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          {actionInProgress === tx.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Accept Request</span>
                        </button>

                        <button
                          type="button"
                          disabled={actionInProgress === tx.id}
                          onClick={() => handleReject(tx.id)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2ded6] text-[#5c645d] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold transition disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    ) : isAccepted ? (
                      <div className="flex flex-col gap-1 items-start md:items-end">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Accepted • Reserved
                        </span>
                        <span className="text-[10px] text-[#5c645d]">
                          Coordinate campus meetup in Messages
                        </span>
                      </div>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-[#5c645d] border border-stone-200">
                        <XCircle className="w-3.5 h-3.5 text-stone-500" /> Declined
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                        {tx.status}
                      </span>
                    )}
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
