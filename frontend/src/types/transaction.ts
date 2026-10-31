import { ListingSummary } from './marketplace';
import { PublicUserOut } from './auth';

export type TransactionStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'meetup_scheduled'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: TransactionStatus;
  buyer_message?: string | null;
  meetup_location?: string | null;
  meetup_datetime?: string | null;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  requested_at: string;
  updated_at: string;
  completed_at?: string | null;

  listing?: ListingSummary | null;
  buyer?: PublicUserOut | null;
  seller?: PublicUserOut | null;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing: ListingSummary;
}

export interface SalesSummaryOut {
  completed_sales: number;
  total_earned_offline: number | string;
  products_sold: number;
}
