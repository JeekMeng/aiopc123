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
