'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { ConversationSummary, ConversationDetail, Message } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import {
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Tag,
  ArrowRight,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Inbox,
  AlertCircle,
  ExternalLink,
  MapPin,
  Calendar,
} from 'lucide-react';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const listingQueryParam = searchParams.get('listing');
  const convQueryParam = searchParams.get('conversation');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<ConversationDetail | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial conversations load
  useEffect(() => {
    async function initInbox() {
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // If a listing parameter was provided, start/get conversation first
        if (listingQueryParam) {
          try {
            const started = await apiClient.post<ConversationDetail>('/conversations', {
              listing_id: listingQueryParam,
            });
            setActiveConvId(started.id);
            setActiveDetail(started);
          } catch (e) {
            console.error('Failed to initiate conversation for listing', e);
          }
        }

        const data = await apiClient.get<ConversationSummary[]>('/conversations');
        setConversations(data);

        // If no active conversation yet, pick first or from convQueryParam
        if (!listingQueryParam) {
          if (convQueryParam && data.some((c) => c.id === convQueryParam)) {
            setActiveConvId(convQueryParam);
          } else if (data.length > 0) {
            setActiveConvId(data[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load messages inbox.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      initInbox();
    }
  }, [isAuthenticated, authLoading, listingQueryParam, convQueryParam]);

  // 2. Fetch conversation detail when activeConvId changes
  useEffect(() => {
    async function loadActiveDetail() {
      if (!activeConvId) {
        setActiveDetail(null);
        return;
      }
      try {
        setDetailLoading(true);
        const detail = await apiClient.get<ConversationDetail>(`/conversations/${activeConvId}`);
        setActiveDetail(detail);

        // Clear unread count locally for this conversation
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
        );
      } catch (err: any) {
        console.error('Failed to load conversation detail', err);
      } finally {
        setDetailLoading(false);
      }
    }

    if (activeConvId) {
      loadActiveDetail();
    }
  }, [activeConvId]);

  // 3. Auto scroll when messages change
  useEffect(() => {
    if (activeDetail?.messages) {
      scrollToBottom();
    }
  }, [activeDetail?.messages]);

  // 4. WebSocket setup for live incoming messages
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connectWs() {
      try {
        const wsUrl = `ws://127.0.0.1:8000/api/v1/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Connected
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_chat_message') {
              const msg: Message = {
                id: data.message.id,
                conversation_id: data.message.conversation_id,
                sender_id: data.message.sender_id,
                message_text: data.message.message_text,
                created_at: data.message.created_at,
                is_mine: data.message.sender_id === user?.id,
              };

              // If for currently open conversation, append to list
              if (data.conversation_id === activeConvId) {
                setActiveDetail((prev) => {
                  if (!prev || prev.id !== data.conversation_id) return prev;
                  if (prev.messages.some((m) => m.id === msg.id)) return prev;
                  return { ...prev, messages: [...prev.messages, msg] };
                });
              }

              // Update conversation snippet in inbox list
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === data.conversation_id) {
                    const isCurrent = c.id === activeConvId;
                    return {
                      ...c,
                      last_message: msg,
                      updated_at: msg.created_at,
                      unread_count: isCurrent || msg.is_mine ? 0 : c.unread_count + 1,
                    };
                  }
                  return c;
                })
              );
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    }

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [isAuthenticated, user, activeConvId]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvId || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const newMsg = await apiClient.post<Message>(
        `/conversations/${activeConvId}/messages`,
        { message_text: textToSend }
      );

      // Append optimistic / confirmed response
      setActiveDetail((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === newMsg.id)) return prev;
        return { ...prev, messages: [...prev.messages, { ...newMsg, is_mine: true }] };
      });

      // Update sidebar snippet
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, last_message: { ...newMsg, is_mine: true }, updated_at: newMsg.created_at }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (val?: string | number) => {
    if (!val) return '';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹ ${num.toLocaleString('en-IN')}`;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
          <MessageSquare className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191c1a] mb-2">
          Campus Conversations
        </h2>
        <p className="text-sm text-[#5c645d] max-w-sm mb-6 leading-relaxed">
          Log in with your verified college email to chat with buyers and sellers and coordinate offline meetups.
        </p>
        <Link
          href="/login?redirect=/messages"
          className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#132c1f] transition shadow-sm"
        >
          Sign In to Access Messages
        </Link>
      </div>
    );
  }

  const filteredConversations = conversations.filter((c) => {
    if (filterTab === 'unread' && c.unread_count === 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.other_participant.full_name.toLowerCase().includes(q);
      const titleMatch = c.listing?.title.toLowerCase().includes(q);
      return nameMatch || titleMatch;
    }
    return true;
  });

  const totalUnreadCount = conversations.reduce((acc, curr) => acc + curr.unread_count, 0);

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-8">
      <div className="max-w-[1312px] mx-auto px-6">
        {/* Header matching Figma Screen s9 */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1a3a2a] mb-1">
            Your campus conversations.
          </h1>
          <p className="text-xs md:text-sm text-[#5c645d]">
            One inbox for all your buying and selling conversations.
          </p>
        </div>

        {/* 2-Column Chat Container matching Figma Screen s9 */}
        <div className="bg-white rounded-3xl border border-[#e2ded6] shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] h-[calc(100vh-220px)]">
          {/* Left Column: Conversations List (4.5 cols) */}
          <div className="md:col-span-4 lg:col-span-4 border-r border-[#e2ded6] flex flex-col bg-white">
            {/* Search Bar */}
            <div className="p-4 border-b border-[#edeae2]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a938c]" />
                <input
                  type="text"
                  placeholder="Search people or products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#f5f3ee] border border-[#e2ded6] text-[#191c1a] placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mt-3 pt-1">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    filterTab === 'all'
                      ? 'bg-[#1a3a2a] text-white shadow-xs'
                      : 'text-[#5c645d] hover:text-[#1a3a2a] bg-[#f5f3ee]'
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                    filterTab === 'unread'
                      ? 'bg-[#1a3a2a] text-white shadow-xs'
                      : 'text-[#5c645d] hover:text-[#1a3a2a] bg-[#f5f3ee]'
                  }`}
                >
                  <span>Unread</span>
                  {totalUnreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Conversation Threads Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#edeae2]/60">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8a938c] flex flex-col items-center justify-center h-full">
                  <Inbox className="w-8 h-8 mb-2 opacity-50" />
                  <span>No conversations found</span>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const other = conv.other_participant;
                  const listing = conv.listing;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left p-4 transition flex items-start gap-3.5 hover:bg-[#f5f3ee]/60 ${
                        isActive ? 'bg-[#e8f0eb]/70 border-l-4 border-[#1a3a2a]' : ''
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-[#edeae2] overflow-hidden shrink-0 border border-[#e2ded6]">
                        {listing?.primary_image_url ? (
                          <img
                            src={listing.primary_image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#8a938c]">
                            <Tag className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-bold text-xs text-[#191c1a] truncate">
                            {other.full_name}
                          </h4>
                          <span className="text-[10px] text-[#8a938c] shrink-0 ml-1">
                            {formatTime(conv.last_message?.created_at || conv.updated_at)}
                          </span>
                        </div>

                        {/* Listing Title & Role Badge */}
                        <div className="text-[11px] text-[#5c645d] truncate mb-1">
                          <span className="font-medium text-[#191c1a]">{listing?.title || 'Listing'}</span>
                          <span className="text-[#8a938c]"> · {conv.role === 'buying' ? 'Buying' : 'Selling'}</span>
                        </div>

                        {/* Last message preview & unread pill */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-[#8a938c] truncate flex-1">
                            {conv.last_message?.message_text || 'Conversation initiated'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                              {conv.unread_count} unread
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Stage (8 cols) */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col bg-[#fdfdfc]">
            {activeDetail ? (
              <>
                {/* Stage Header matching Figma Screen s9 */}
                <div className="px-6 py-3.5 border-b border-[#e2ded6] bg-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e8f0eb] border border-[#d8e5dc] flex items-center justify-center text-[#1a3a2a] font-bold text-xs shrink-0">
                      {activeDetail.other_participant.avatar_url ? (
                        <img
                          src={activeDetail.other_participant.avatar_url}
                          alt={activeDetail.other_participant.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        activeDetail.other_participant.full_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#191c1a]">
                        {activeDetail.other_participant.full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5c645d]">
                        {activeDetail.other_participant.is_email_verified && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-800 font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Student
                          </span>
                        )}
                        {activeDetail.other_participant.campus_name && (
                          <span> · {activeDetail.other_participant.campus_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/users/${activeDetail.other_participant.id}`}
                    className="px-3.5 py-1.5 rounded-xl border border-[#e2ded6] hover:bg-[#f5f3ee] text-xs font-semibold text-[#1a3a2a] transition"
                  >
                    View Profile
                  </Link>
                </div>

                {/* Contextual Listing Banner matching Figma Screen s9 */}
                {activeDetail.listing && (
                  <div className="bg-[#f5f3ee]/80 border-b border-[#e2ded6] px-6 py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#e2ded6] overflow-hidden shrink-0">
                        {activeDetail.listing.primary_image_url ? (
                          <img
                            src={activeDetail.listing.primary_image_url}
                            alt={activeDetail.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tag className="w-4 h-4 m-auto text-[#8a938c]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#191c1a] truncate">
                            {activeDetail.listing.title}
                          </span>
                          <span className="font-bold text-xs text-[#1a3a2a] shrink-0">
                            · {formatPrice(activeDetail.listing.price)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5c645d] flex items-center gap-1">
                          <span>
                            {activeDetail.role === 'buying'
                              ? `You're buying from ${activeDetail.other_participant.full_name}`
                              : `You're selling to ${activeDetail.other_participant.full_name}`}
                          </span>
                          <span>·</span>
                          <Link
                            href={`/product/${activeDetail.listing.id}`}
                            className="font-medium text-[#1a3a2a] hover:underline flex items-center gap-0.5"
                          >
                            <span>View Listing</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeDetail.role === 'selling' && (
                        <Link
                          href="/enquiries"
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#e2ded6] hover:bg-[#edeae2] text-[11px] font-semibold text-[#1a3a2a] transition flex items-center gap-1 shadow-xs"
                        >
                          <MapPin className="w-3 h-3 text-[#1a3a2a]" />
                          <span>Meetup & Handover</span>
                        </Link>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                          activeDetail.listing.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : activeDetail.listing.status === 'reserved'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {activeDetail.listing.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message History Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Date Badge */}
                  <div className="text-center my-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#edeae2]/70 text-[#5c645d]">
                      CAMPUS CONVERSATION · 31 OCTOBER 2026
                    </span>
                  </div>

                  {detailLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#1a3a2a]" />
                    </div>
                  ) : activeDetail.messages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#8a938c]">
                      No messages yet. Send a note to discuss item condition and coordinate a safe campus meetup!
                    </div>
                  ) : (
                    activeDetail.messages.map((msg) => {
                      const isMine = msg.is_mine;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isMine
                                ? 'bg-[#1a3a2a] text-white rounded-br-xs'
                                : 'bg-[#edeae2]/80 text-[#191c1a] rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message_text}</p>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[#8a938c] mt-1 px-1">
                            <span>{formatTime(msg.created_at)}</span>
                            {isMine && (
                              <span title="Sent to campus network">
                                <CheckCheck className="w-3 h-3 text-[#1a3a2a]" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <div className="p-4 bg-white border-t border-[#e2ded6]">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type a message to coordinate campus meetup..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sending}
                      className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-[#f5f3ee] border border-[#e2ded6] text-[#191c1a] placeholder:text-[#8a938c] focus:outline-none focus:border-[#1a3a2a]"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || sending}
                      className="w-10 h-10 rounded-2xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white flex items-center justify-center transition shadow-xs disabled:opacity-40"
                      aria-label="Send message"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8a938c]">
                <MessageSquare className="w-12 h-12 mb-3 text-[#1a3a2a]/30" />
                <h3 className="font-serif text-lg font-bold text-[#191c1a] mb-1">
                  Select a Conversation
                </h3>
                <p className="text-xs text-[#5c645d] max-w-xs">
                  Choose a thread from the left or message a seller directly from any product listing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
