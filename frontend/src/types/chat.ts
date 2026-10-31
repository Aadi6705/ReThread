export interface ParticipantPublic {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  is_email_verified: boolean;
  campus_name?: string | null;
}

export interface ListingSnippet {
  id: string;
  title: string;
  price: string | number;
  status: string;
  primary_image_url?: string | null;
  seller_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  is_mine: boolean;
}

export interface ConversationSummary {
  id: string;
  listing_id?: string | null;
  transaction_id?: string | null;
  listing?: ListingSnippet | null;
  other_participant: ParticipantPublic;
  role: 'buying' | 'selling';
  last_message?: Message | null;
  unread_count: number;
  updated_at: string;
}

export interface ConversationDetail {
  id: string;
  listing_id?: string | null;
  transaction_id?: string | null;
  listing?: ListingSnippet | null;
  other_participant: ParticipantPublic;
  role: 'buying' | 'selling';
  messages: Message[];
}
