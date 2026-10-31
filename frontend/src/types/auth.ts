export interface College {
  id: string;
  name: string;
  email_domain: string;
  campus_name: string;
  location: string;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  profile_image?: string | null;
  department?: string | null;
  course?: string | null;
  academic_year?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  is_email_verified: boolean;
  account_status: string;
  created_at: string;
  college?: College | null;
  profile?: StudentProfile | null;
}

export interface PublicUserOut {
  id: string;
  college_name: string;
  campus_name: string;
  is_email_verified: boolean;
  profile?: StudentProfile | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
