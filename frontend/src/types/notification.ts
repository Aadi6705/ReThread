export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_listing_id?: string | null;
  related_transaction_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}
