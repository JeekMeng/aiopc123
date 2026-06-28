export interface User {
  id: number;
  email: string;
  password_hash: string;
  nickname: string;
  avatar: string;
  role: string;
  created_at: string;
  last_login_ip?: string;
}

export interface Bookmark {
  id: number;
  user_id: number;
  site_id: number | null;
  title: string;
  url: string;
  description: string;
  logo: string;
  is_public: number;
  created_at: string;
}

export interface Comment {
  id: number;
  user_id: number;
  site_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  nickname?: string;
  avatar?: string;
}

export interface Policy {
  id: string;
  name: string;
  city: string;
  province: string;
  district: string;
  level: string;
  issuer: string;
  publish_date: string;
  status: string;
  category: string;
  summary: string;
  benefits: string;
  requirements: string;
  application: string;
  links: string;
  communities: string;
  tags: string;
  landing_status: string;
  materials: string;
  created_at: string;
  updated_at: string;
}
