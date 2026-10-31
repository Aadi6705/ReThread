import { ListingSummary } from './marketplace';
import { PublicUserOut } from './auth';

export interface SellerListingPerformance {
  id: string;
  title: string;
  price: number | string;
  status: string;
  category_name: string;
  primary_image_url?: string | null;
  views: number;
  enquiries: number;
  created_at: string;
  updated_at: string;
}

export interface SellerRecentActivity {
  id: string;
  type: 'new_enquiry' | 'requested' | 'meetup_scheduled' | 'completed' | 'message';
  buyer_name: string;
  buyer_avatar_url?: string | null;
  listing_title: string;
  listing_price?: number | string | null;
  snippet?: string | null;
  created_at: string;
}

export interface SellerPendingNotice {
  transaction_id: string;
  buyer_name: string;
  listing_title: string;
}

export interface SellerDashboardMetrics {
  active_listings: number;
  total_views: number;
  buyer_enquiries: number;
  total_conversations: number;
  unread_conversations: number;
  items_sold: number;
  total_earned_offline: number | string;
  categories_count: number;
}

export interface SellerDashboardData {
  metrics: SellerDashboardMetrics;
  pending_notice?: SellerPendingNotice | null;
  listing_performance: SellerListingPerformance[];
  recent_activity: SellerRecentActivity[];
}

export interface SellerListingCounts {
  all: number;
  active: number;
  draft: number;
  reserved: number;
  sold: number;
  archived: number;
}

export interface SellerReputationData {
  user: PublicUserOut;
  active_listings_count: number;
  categories_count: number;
  completed_sales_count: number;
  total_earned_offline: number | string;
  community_rating: number;
  reviews_count: number;
  active_listings: ListingSummary[];
}
