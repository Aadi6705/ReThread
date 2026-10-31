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
  Calendar,
  MessageSquare,
  ArrowRight,
  HandCoins,
  Ban,
  Check,
  X,
} from 'lucide-react';

const CAMPUS_LANDMARKS = [
  'Student Activity Centre (SAC)',
  'Central Library Front Gate',
  'Main Quad / Amphitheatre',
  'Hostel Mess & Common Hall',
  'Campus Canteen Porch',
  'Academic Block 1 Entrance',
  'Sports Complex Pavilion',
];

export default function EnquiriesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [enquiries, setEnquiries] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Meetup modal state
  const [meetupTx, setMeetupTx] = useState<Transaction | null>(null);
  const [meetupLocation, setMeetupLocation] = useState(CAMPUS_LANDMARKS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [meetupDatetime, setMeetupDatetime] = useState('');

  // Cancel modal state
  const [cancelTx, setCancelTx] = useState<Transaction | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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

  const handleOpenMeetupModal = (tx: Transaction) => {
    setMeetupTx(tx);
    setMeetupLocation(CAMPUS_LANDMARKS[0]);
    setCustomLocation('');
    // default to tomorrow 5pm
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    setMeetupDatetime(tomorrow.toISOString().slice(0, 16));
  };

  const handleSaveMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetupTx) return;

    const finalLocation = meetupLocation === 'Custom' ? customLocation : meetupLocation;
    if (!finalLocation.trim()) {
      setFeedback({ msg: 'Please provide a valid campus landmark.', type: 'error' });
      return;
    }
    if (!meetupDatetime) {
      setFeedback({ msg: 'Please choose a meetup date and time.', type: 'error' });
      return;
    }

    setActionInProgress(meetupTx.id);
    setFeedback(null);

    try {
      const updated = await apiClient.post<Transaction>(
        `/transactions/${meetupTx.id}/schedule-meetup`,
        {
          meetup_location: finalLocation.trim(),
          meetup_datetime: new Date(meetupDatetime).toISOString(),
        }
      );
      setEnquiries((prev) =>
        prev.map((item) => (item.id === meetupTx.id ? updated : item))
      );
      setFeedback({
        msg: `Campus meetup scheduled at ${finalLocation}! The buyer has been notified.`,
        type: 'success',
      });
      setMeetupTx(null);
    } catch (err: any) {
      setFeedback({
        msg: err.message || 'Failed to schedule meetup.',
        type: 'error',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmCompletion = async (txId: string) => {
    setActionInProgress(txId);
    setFeedback(null);
    try {
      const updated = await apiClient.post<Transaction>(
        `/transactions/${txId}/confirm-completion`
      );
      setEnquiries((prev) =>
        prev.map((item) => (item.id === txId ? updated : item))
      );
      if (updated.status === 'completed') {
        setFeedback({
          msg: '🎉 Exchange completed! Both students confirmed physical handover. Sale recorded in Sales History.',
          type: 'success',
        });
      } else {
        setFeedback({
          msg: 'Handover confirmed on your side! Waiting for the buyer to confirm their receipt to finalize.',
          type: 'success',
        });
      }
    } catch (err: any) {
      setFeedback({
        msg: err.message || 'Failed to confirm handover.',
        type: 'error',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenCancelModal = (tx: Transaction) => {
    setCancelTx(tx);
    setCancelReason('');
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTx) return;

    if (!cancelReason.trim()) {
      setFeedback({ msg: 'Please provide a cancellation reason.', type: 'error' });
      return;
    }

    setActionInProgress(cancelTx.id);
    setFeedback(null);

    try {
      const updated = await apiClient.post<Transaction>(
        `/transactions/${cancelTx.id}/cancel`,
        {
          reason: cancelReason.trim(),
        }
      );
      setEnquiries((prev) =>
        prev.map((item) => (item.id === cancelTx.id ? updated : item))
      );
      setFeedback({
        msg: 'Transaction cancelled. The listing has been released back to Active for other students.',
        type: 'success',
      });
      setCancelTx(null);
    } catch (err: any) {
      setFeedback({
        msg: err.message || 'Failed to cancel transaction.',
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

  const formatMeetupTime = (dtStr?: string | null) => {
    if (!dtStr) return '';
    try {
      const d = new Date(dtStr);
      return d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dtStr;
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
              Incoming purchase requests, campus meetup coordination, and handover confirmations
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#edeae2] border border-[#e2ded6] self-start sm:self-auto text-xs overflow-x-auto">
            {[
              { val: 'all', label: 'All Requests' },
              { val: 'requested', label: 'Pending' },
              { val: 'accepted', label: 'Accepted / Meetup' },
              { val: 'completed', label: 'Completed' },
              { val: 'rejected', label: 'Declined' },
            ].map((tab) => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setStatusFilter(tab.val)}
                className={`px-3 py-1.5 rounded-full font-semibold transition whitespace-nowrap ${
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
              const isMeetupScheduled = tx.status === 'meetup_scheduled';
              const isCompleted = tx.status === 'completed';
              const isRejected = tx.status === 'rejected';
              const isCancelled = tx.status === 'cancelled';

              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-3xl border border-[#e2ded6] p-6 shadow-xs hover:shadow-sm transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
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

                  {/* Middle: Buyer Information & Meetup details */}
                  <div className="flex-1 border-t lg:border-t-0 lg:border-l border-[#edeae2] pt-4 lg:pt-0 lg:pl-6 space-y-2 w-full lg:w-auto">
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

                    {tx.buyer_message && (
                      <p className="text-xs text-[#5c645d] bg-[#f5f3ee] p-2.5 rounded-xl border border-[#e2ded6]">
                        "{tx.buyer_message}"
                      </p>
                    )}

                    {/* Meetup Scheduled Info Banner */}
                    {tx.meetup_location && (
                      <div className="p-2.5 rounded-xl bg-[#eef3ef] border border-[#dce6df] text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-[#1a3a2a]">
                          <MapPin className="w-3.5 h-3.5 text-[#1a3a2a]" />
                          <span>Meetup at: {tx.meetup_location}</span>
                        </div>
                        {tx.meetup_datetime && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#5c645d] pl-5">
                            <Clock className="w-3 h-3 text-[#5c645d]" />
                            <span>{formatMeetupTime(tx.meetup_datetime)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-[#8a938c] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Requested on {new Date(tx.requested_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right: Actions and Dual Confirmation */}
                  <div className="border-t lg:border-t-0 lg:border-l border-[#edeae2] pt-4 lg:pt-0 lg:pl-6 shrink-0 flex flex-col gap-2 w-full lg:w-72">
                    {isPending ? (
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <button
                          type="button"
                          disabled={actionInProgress === tx.id}
                          onClick={() => handleAccept(tx.id)}
                          className="w-full px-5 py-2.5 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
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
                          className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded6] text-[#5c645d] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold transition disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (isAccepted || isMeetupScheduled) ? (
                      <div className="space-y-2">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {isMeetupScheduled ? 'Meetup Scheduled' : 'Reserved'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(tx)}
                            className="text-[11px] text-stone-500 hover:text-rose-600 transition"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Schedule / Reschedule Meetup */}
                        <button
                          type="button"
                          onClick={() => handleOpenMeetupModal(tx)}
                          className="w-full px-4 py-2 rounded-xl border border-[#1a3a2a] text-[#1a3a2a] hover:bg-[#eef3ef] text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{tx.meetup_location ? 'Change Meetup Plan' : 'Schedule Meetup'}</span>
                        </button>

                        {/* Confirm Exchange Button */}
                        <button
                          type="button"
                          disabled={actionInProgress === tx.id || tx.seller_confirmed}
                          onClick={() => handleConfirmCompletion(tx.id)}
                          className={`w-full px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs ${
                            tx.seller_confirmed
                              ? 'bg-stone-100 text-stone-500 cursor-not-allowed border border-stone-200'
                              : 'bg-[#1a3a2a] text-white hover:bg-[#132c1f]'
                          }`}
                        >
                          {actionInProgress === tx.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <HandCoins className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {tx.seller_confirmed
                              ? 'Handover Confirmed'
                              : 'Confirm Handover & Payment'}
                          </span>
                        </button>

                        {/* Dual Confirmation Status Tracker */}
                        <div className="bg-[#f5f3ee] p-2 rounded-xl border border-[#e2ded6] text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[#5c645d]">Seller (You):</span>
                            <span className={tx.seller_confirmed ? 'text-emerald-700 font-bold' : 'text-stone-500'}>
                              {tx.seller_confirmed ? '✓ Confirmed' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#5c645d]">Buyer:</span>
                            <span className={tx.buyer_confirmed ? 'text-emerald-700 font-bold' : 'text-stone-500'}>
                              {tx.buyer_confirmed ? '✓ Confirmed' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <Link
                          href="/messages"
                          className="text-[11px] text-[#1a3a2a] hover:underline flex items-center justify-center gap-1 pt-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat with Buyer</span>
                        </Link>
                      </div>
                    ) : isCompleted ? (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#e5ede7] text-[#1a3a2a]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed & Sold
                        </span>
                        <p className="text-[10px] text-[#5c645d] leading-relaxed">
                          Both students confirmed physical handover on campus.
                        </p>
                        <Link
                          href="/sales"
                          className="text-xs text-[#1a3a2a] font-semibold hover:underline flex items-center gap-1"
                        >
                          <span>View in Sales History</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-[#5c645d] border border-stone-200">
                        <XCircle className="w-3.5 h-3.5 text-stone-500" /> Declined
                      </span>
                    ) : isCancelled ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <Ban className="w-3.5 h-3.5" /> Cancelled & Item Restored
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

      {/* Schedule Meetup Modal */}
      {meetupTx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#e2ded6] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2ded6] mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1a3a2a]" />
                <h3 className="font-serif text-lg font-bold text-[#191c1a]">
                  Coordinate Campus Meetup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMeetupTx(null)}
                className="w-8 h-8 rounded-full hover:bg-[#f5f3ee] flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                  Campus Landmark
                </label>
                <select
                  value={meetupLocation}
                  onChange={(e) => setMeetupLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs bg-white focus:outline-hidden focus:border-[#1a3a2a]"
                >
                  {CAMPUS_LANDMARKS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="Custom">Custom Campus Spot...</option>
                </select>
              </div>

              {meetupLocation === 'Custom' && (
                <div>
                  <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                    Specify Campus Spot
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Nescafe kiosk, Biotech building"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs bg-white focus:outline-hidden focus:border-[#1a3a2a]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                  Meetup Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={meetupDatetime}
                  onChange={(e) => setMeetupDatetime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs bg-white focus:outline-hidden focus:border-[#1a3a2a]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#f5f3ee] border border-[#e2ded6] text-[11px] text-[#5c645d] leading-relaxed">
                💡 ReThread meetups happen in public campus spaces. Remember to inspect the item
                and exchange cash or direct student UPI before marking completion.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMeetupTx(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5c645d] hover:bg-[#f5f3ee] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === meetupTx.id}
                  className="px-5 py-2 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                >
                  {actionInProgress === meetupTx.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Notify Buyer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Transaction Modal */}
      {cancelTx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#e2ded6] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2ded6] mb-4">
              <div className="flex items-center gap-2 text-rose-700">
                <Ban className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-[#191c1a]">
                  Cancel Transaction
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelTx(null)}
                className="w-8 h-8 rounded-full hover:bg-[#f5f3ee] flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <p className="text-xs text-[#5c645d] leading-relaxed">
                Cancelling this transaction will release the listing back to{' '}
                <span className="font-semibold text-[#1a3a2a]">Active</span> status so other campus
                students can purchase it.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#191c1a] mb-1.5">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Buyer didn't show up at SAC, or item condition changed..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] text-xs bg-white focus:outline-hidden focus:border-[#1a3a2a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTx(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5c645d] hover:bg-[#f5f3ee] transition"
                >
                  Keep Transaction
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === cancelTx.id}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                >
                  {actionInProgress === cancelTx.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Ban className="w-3.5 h-3.5" />
                  )}
                  <span>Cancel Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
