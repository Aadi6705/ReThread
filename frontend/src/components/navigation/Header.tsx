'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useModeStore } from '@/store/useModeStore';
import { ModeSwitcher } from './ModeSwitcher';
import { apiClient } from '@/lib/api/client';
import { NotificationItem, UnreadCountResponse } from '@/types/notification';
import {
  MessageSquare,
  Bell,
  LogOut,
  LogIn,
  ShoppingBag,
  PlusCircle,
  ShieldCheck,
  Check,
  PackageOpen,
  ArrowRight,
  Inbox,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react';

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { mode } = useModeStore();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll / Fetch notifications & unread counts
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    async function fetchCounts() {
      try {
        const [notifCount, convs] = await Promise.all([
          apiClient.get<UnreadCountResponse>('/notifications/unread-count'),
          apiClient.get<any[]>('/conversations'),
        ]);
        setUnreadNotifications(notifCount.unread_count);
        const unreadMsgs = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        setUnreadMessages(unreadMsgs);
      } catch (e) {
        // guest or network error
      }
    }

    fetchCounts();

    // Setup WebSocket listener for real-time notification badge updates
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_notification') {
            setUnreadNotifications((prev) => prev + 1);
            setNotifications((prev) => [data.notification, ...prev]);
          } else if (data.type === 'new_chat_message') {
            if (data.message.sender_id !== user.id && pathname !== '/messages') {
              setUnreadMessages((prev) => prev + 1);
            }
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (ws) ws.close();
    };
  }, [isAuthenticated, user, pathname]);

  // Load notification items when dropdown opened
  const toggleNotifDropdown = async () => {
    const nextState = !notifDropdownOpen;
    setNotifDropdownOpen(nextState);
    if (nextState) {
      try {
        const data = await apiClient.get<NotificationItem[]>('/notifications');
        setNotifications(data);
      } catch {}
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      setUnreadNotifications(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.is_read) {
        await apiClient.patch(`/notifications/${notif.id}/read`);
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      }
    } catch {}

    setNotifDropdownOpen(false);

    if (notif.type === 'new_message') {
      router.push('/messages');
    } else if (notif.type === 'purchase_request') {
      router.push('/enquiries');
    } else if (notif.related_listing_id) {
      router.push(`/product/${notif.related_listing_id}`);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2ded6]">
      <div className="max-w-[1312px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Motto */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#1a3a2a] group-hover:opacity-90 transition-opacity">
              ReThread
            </span>
            <span className="text-[10px] tracking-wider text-[#5c645d] -mt-1 font-medium">
              Good finds deserve another life.
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            {mode === 'buy' ? (
              <>
                <Link
                  href="/discover"
                  className={`transition ${
                    pathname === '/discover'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  Discover
                </Link>
                <Link
                  href="/explore"
                  className={`transition ${
                    pathname === '/explore'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  Explore
                </Link>
                <Link
                  href="/wishlist"
                  className={`transition ${
                    pathname === '/wishlist'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  Wishlist
                </Link>
                <Link
                  href="/messages"
                  className={`transition flex items-center gap-1.5 ${
                    pathname === '/messages'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  <span>Messages</span>
                  {unreadMessages > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#1a3a2a] text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`transition ${
                    pathname === '/dashboard'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/listings"
                  className={`transition ${
                    pathname === '/listings'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  My Listings
                </Link>
                <Link
                  href="/listings/create"
                  className={`transition flex items-center gap-1 ${
                    pathname === '/listings/create'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Listing</span>
                </Link>
                <Link
                  href="/enquiries"
                  className={`transition flex items-center gap-1.5 ${
                    pathname === '/enquiries'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  <span>Buyer Enquiries</span>
                </Link>
                <Link
                  href="/sales"
                  className={`transition flex items-center gap-1.5 ${
                    pathname === '/sales'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  <span>Sales History</span>
                </Link>
                <Link
                  href="/messages"
                  className={`transition flex items-center gap-1.5 ${
                    pathname === '/messages'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  <span>Messages</span>
                  {unreadMessages > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#1a3a2a] text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className={`transition ${
                    pathname === '/profile'
                      ? 'text-[#1a3a2a] font-bold border-b-2 border-[#1a3a2a] pb-1'
                      : 'text-[#5c645d] hover:text-[#1a3a2a]'
                  }`}
                >
                  Profile
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-4">
          <ModeSwitcher />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Messages Quick Icon Button */}
              <Link
                href="/messages"
                className="relative p-2 rounded-full text-[#5c645d] hover:text-[#1a3a2a] hover:bg-[#edeae2] transition"
                aria-label="Campus Messages"
                title="Campus Conversations"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#1a3a2a] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={toggleNotifDropdown}
                  className="relative p-2 rounded-full text-[#5c645d] hover:text-[#1a3a2a] hover:bg-[#edeae2] transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Popover Flyout */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-[#e2ded6] shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-4 border-b border-[#edeae2] flex items-center justify-between bg-[#f5f3ee]/50">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-sm text-[#1a3a2a]">
                          Campus Alerts
                        </h4>
                        {unreadNotifications > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>
                      {unreadNotifications > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-[11px] font-semibold text-[#1a3a2a] hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#edeae2]/60">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#8a938c]">
                          <Inbox className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <span>No notifications at the moment</span>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-[#f5f3ee] ${
                              !notif.is_read ? 'bg-[#e8f0eb]/30' : ''
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-emerald-600" style={{ opacity: notif.is_read ? 0 : 1 }} />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-xs text-[#191c1a] truncate mb-0.5">
                                {notif.title}
                              </h5>
                              <p className="text-[11px] text-[#5c645d] line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-[#8a938c] block mt-1">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#e2ded6]">
                <div
                  className="h-8 w-8 rounded-full bg-[#1a3a2a] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0"
                  title={user.profile?.full_name || user.email}
                >
                  {getInitials(user.profile?.full_name)}
                </div>
                <div className="hidden lg:block text-left text-xs max-w-[120px]">
                  <p className="font-semibold text-[#191c1a] truncate leading-tight">
                    {user.profile?.full_name || 'Student'}
                  </p>
                  <p className="text-[10px] text-[#5c645d] truncate">
                    {user.college?.campus_name || 'Campus'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="p-1.5 text-[#8a938c] hover:text-rose-600 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1a3a2a] hover:bg-[#edeae2] transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#1a3a2a] hover:bg-[#132c1f] text-white shadow-xs transition"
              >
                Join Campus
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#5c645d] hover:text-[#1a3a2a] hover:bg-[#edeae2] transition ml-1"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (390px screens) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-t border-[#e2ded6] px-6 py-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-3 text-xs font-semibold">
            {mode === 'buy' ? (
              <>
                <Link
                  href="/discover"
                  className={`p-2 rounded-lg transition ${
                    pathname === '/discover'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  Discover Catalog
                </Link>
                <Link
                  href="/explore"
                  className={`p-2 rounded-lg transition ${
                    pathname === '/explore'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  Explore with Filters
                </Link>
                <Link
                  href="/wishlist"
                  className={`p-2 rounded-lg transition flex items-center justify-between ${
                    pathname === '/wishlist'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  <span>Saved Finds</span>
                  <ShoppingBag className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/messages"
                  className={`p-2 rounded-lg transition flex items-center justify-between ${
                    pathname === '/messages'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  <span>Campus Messages</span>
                  {unreadMessages > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`p-2 rounded-lg transition ${
                    pathname === '/dashboard'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  Seller Dashboard
                </Link>
                <Link
                  href="/listings"
                  className={`p-2 rounded-lg transition ${
                    pathname === '/listings'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  My Listings
                </Link>
                <Link
                  href="/listings/create"
                  className={`p-2 rounded-lg transition flex items-center justify-between ${
                    pathname === '/listings/create'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  <span>+ Create Listing</span>
                  <PlusCircle className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/enquiries"
                  className={`p-2 rounded-lg transition ${
                    pathname === '/enquiries'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  Buyer Enquiries
                </Link>
                <Link
                  href="/sales"
                  className={`p-2 rounded-lg transition ${
                    pathname === '/sales'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  Sales History (Offline Earnings)
                </Link>
                <Link
                  href="/messages"
                  className={`p-2 rounded-lg transition flex items-center justify-between ${
                    pathname === '/messages'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  <span>Messages</span>
                  {unreadMessages > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className={`p-2 rounded-lg transition ${
                    pathname === '/profile'
                      ? 'bg-[#1a3a2a] text-white'
                      : 'text-[#191c1a] hover:bg-[#f5f3ee]'
                  }`}
                >
                  My Seller Profile
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export const Header: React.FC = () => {
  return (
    <Suspense fallback={<header className="h-16 bg-white/95 border-b border-[#e2ded6]" />}>
      <HeaderContent />
    </Suspense>
  );
};
