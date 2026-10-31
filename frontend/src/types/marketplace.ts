import { PublicUserOut, StudentProfile } from './auth';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  is_active: boolean;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;
  cloudinary_public_id: string;
  display_order: number;
  created_at: string;
}

export interface ListingSummary {
  id: string;
  seller_id: string;
  college_id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  title: string;
  price: string | number;
  original_price?: string | number | null;
  condition: 'like_new' | 'excellent' | 'good' | 'fair';
  brand?: string | null;
  status: 'draft' | 'active' | 'reserved' | 'sold' | 'archived';
  primary_image_url?: string | null;
  campus_name: string;
  college_name: string;
  seller_name: string;
  seller_is_verified: boolean;
  created_at: string;
}

export interface ListingDetail {
  id: string;
  seller_id: string;
  college_id: string;
  category_id: string;
  title: string;
  description: string;
  price: string | number;
  original_price?: string | number | null;
  condition: 'like_new' | 'excellent' | 'good' | 'fair';
  brand?: string | null;
  status: 'draft' | 'active' | 'reserved' | 'sold' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string | null;

  category: Category;
  college: {
    id: string;
    name: string;
    email_domain: string;
    campus_name: string;
    location: string;
  };
  seller: {
    id: string;
    college_name: string;
    campus_name: string;
    is_email_verified: boolean;
    profile?: StudentProfile | null;
  };
  images: ListingImage[];
}

export interface PaginatedListings {
  items: ListingSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
