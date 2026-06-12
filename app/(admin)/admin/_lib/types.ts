export type Tab = 'stats' | 'verify' | 'users' | 'posts' | 'tickets' | 'warnings' | 'subscriptions' | 'tools'

export interface TicketMessage {
  id: string
  ticket_id: string
  sender: 'user' | 'admin'
  body: string | null
  image_url: string | null
  created_at: string
}

export interface Ticket {
  id: string
  user_id: string | null
  email: string | null
  display_name: string | null
  username: string | null
  title: string
  message: string
  image_url: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  page_context: string | null
  admin_reply: string | null
  admin_reply_image_url: string | null
  user_reply: string | null
  user_reply_image_url: string | null
  user_reply_at: string | null
  admin_reply_at: string | null
  created_at: string
  updated_at: string
}

export interface VerifyRequest {
  id: string
  user_id: string
  username: string
  display_name: string | null
  email: string | null
  profession: string | null
  specializations: string[] | null
  doc_url: string | null
  note: string | null
  status: string
  created_at: string
}

export interface UserRow {
  id: string
  username: string
  display_name: string | null
  full_name: string | null
  profession: string | null
  is_verified: boolean
  avatar_color: number
  avatar_url: string | null
  email: string | null
  subscription_tier: string | null
  created_at: string
}

export interface PostRow {
  id: string
  user_id: string
  post_type: string
  body: string | null
  visibility: string
  category: string | null
  is_question: boolean
  created_at: string
  profiles: { username: string; display_name: string | null; full_name: string | null } | null
}

export interface Warning {
  id: string
  user_id: string
  post_id: string | null
  type: 'delete' | 'warn'
  reason: string
  custom_note: string | null
  created_at: string
  expires_at: string
  profiles: { username: string; display_name: string | null } | null
}

export interface Stats {
  users: number
  posts: number
  pendingVerify: number
  verifiedUsers: number
  todayViews: number
  totalViews: number
}

export interface DayCount { date: string; count: number }
export interface ChartData {
  views30: DayCount[]
  users30: DayCount[]
  posts30: DayCount[]
}

export type RangeMode =
  | { type: 'preset'; days: number; label: string }
  | { type: 'custom'; from: string; to: string }
  | { type: 'all' }

export type SubUser = {
  id: string
  display_name: string | null
  username: string | null
  avatar_color: number
  avatar_url: string | null
  email: string | null
}
