export interface User {
  id: number;
  email: string;
  password_hash: string;
  nickname: string;
  avatar: string;
  role: string;
  vip_level: string;
  points: number;
  streak_days: number;
  last_sign_date: string;
  created_at: string;
  last_login_ip?: string;
  city: string;
  province: string;
  industries: string;
  company_type: string;
  interests: string;
  bio: string;
  notify_prefs: string;
}

export interface UserNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string;
  link: string;
  ref_id: string;
  is_read: number;
  created_at: string;
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

export interface Opc {
  id: number;
  user_id: number;
  name: string;
  description: string;
  logo: string;
  address: string;
  website: string;
  slogan: string;
  contact_phone: string;
  contact_email: string;
  industry: string;
  sub_category: string;
  is_active: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface OpcProduct {
  id: number;
  opc_id: number;
  user_id: number;
  name: string;
  description: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface OpcDepartment {
  id: number;
  opc_id: number;
  user_id: number;
  name: string;
  description: string;
  leader: string;
  tools: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OpcTodo {
  id: number;
  opc_id: number;
  user_id: number;
  text: string;
  priority: string;
  due_date: string;
  done: number;
  created_at: string;
  updated_at: string;
}

export interface OpcNotice {
  id: number;
  opc_id: number;
  user_id: number;
  type: string;
  title: string;
  content: string;
  is_read: number;
  created_at: string;
}

export interface OpcTemplate {
  id: number;
  name: string;
  industry: string;
  description: string;
  screenshot: string;
  step_data: string;
  departments: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface NavSite {
  id: string;
  name: string;
  title: string;
  url: string;
  description: string;
  logo: string;
  category: string;
  tags: string;
  score: number;
  company: string;
  updated_at: string;
}

export interface PointLog {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  action: string;
  description: string;
  ref_id: number | null;
  created_at: string;
}

export interface SignRecord {
  id: number;
  user_id: number;
  sign_date: string;
  streak: number;
  created_at: string;
}
