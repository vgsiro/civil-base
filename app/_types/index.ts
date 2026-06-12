export interface Subject {
  id: string
  name: string
  code: string
  category: string
  color: string
}

export interface Section {
  id: string
  name: string
  subject_id: string
  section_type: 'notes' | 'formula' | 'mindmap' | null
}

export interface MindMapNode {
  id: string
  label: string
  description: string
  lec: number | null
  page: number | null
  children: MindMapNode[]
}

export interface MindMap {
  id: string
  section_id: string
  pdf_id: string
  title: string
  nodes: MindMapNode[]
  created_at: string
  updated_at: string
}

export interface LectureMindMap {
  lecNumber: number
  pdfId: string
  pdfName: string
  pdfUrl: string
  map: MindMap | null
}

export interface Pdf {
  id: string
  name: string
  section_id: string
  pages: number
  file_url: string
  file_type: 'pdf' | 'image'
}

export interface Formula {
  id: string
  section_id: string
  name: string
  content: string
  images: string[]
  created_at: string
  updated_at: string
}

export interface SearchResult {
  id: string
  page_number: number
  heading: string
  content: string
  pdfs: {
    name: string
    file_url: string
    sections: {
      name: string
      subjects: { name: string }
    }
  }
}

export interface UploadQueueItem {
  name: string
  progress: number
  msg: string
  done: boolean
  error: boolean
}

export interface ChatSource {
  type: 'pdf' | 'formula'
  name: string
  page?: number
  pdf_id?: string
  section_id?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  model?: string
  sources?: ChatSource[]
}

export interface ChatSession {
  id: string
  scope: string
  scope_name: string
  updated_at: string
}

export interface StorageInfo {
  usedMB: string
  limitGB: string
  percent: number
  fileCount: number
}

export interface RenameState {
  type: 'subject' | 'section'
  id: string
  name: string
  code?: string
  category?: string
}

// ── Community / Social ────────────────────────────────────────────────────────

export interface FeaturedLink {
  label: string
  url: string
}

export interface Profile {
  id: string
  username: string
  family_name: string | null
  given_name: string | null
  display_name: string | null
  full_name: string | null
  profession: string | null
  organization: string | null
  description: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  experience: string | null
  specializations: string[] | null
  featured_links: FeaturedLink[] | null
  is_verified: boolean
  pending_profession: string | null
  pending_specializations: string[] | null
  avatar_url: string | null
  cover_url: string | null
  avatar_color: number
  created_at: string
  preferred_locale: string | null
}

export type PostType = 'text' | 'image' | 'link' | 'question' | 'reshare' | 'profile_photo' | 'cover_photo'
export type PostVisibility = 'public' | 'friends' | 'private' | 'admin_hidden' | 'warn_limited'
export type PostCategory = 'concrete' | 'steel' | 'composite' | 'geotechnical' | 'others'

export interface Post {
  id: string
  user_id: string
  post_type: PostType
  visibility: PostVisibility
  category: PostCategory
  body: string | null
  media_url: string | null
  linked_subject_id: string | null
  linked_section_id: string | null
  linked_url: string | null
  linked_title: string | null
  is_question: boolean
  poll_options: string[] | null
  poll_open: boolean
  reshared_post_id: string | null
  created_at: string
  updated_at: string
}

export interface PostAuthor {
  id: string
  username: string
  family_name: string | null
  given_name: string | null
  display_name: string | null
  full_name: string | null
  profession: string | null
  specializations: string[] | null
  is_verified: boolean
  avatar_color: number
  avatar_url: string | null
}

export interface PostWithProfile extends Post {
  profiles: PostAuthor
  post_likes: { user_id: string }[]
  post_comments: { id: string }[]
  post_recommendations: { user_id: string }[]
  reshared_post?: PostWithProfile | null
}

export interface SavedCollection {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface SavedPost {
  id: string
  user_id: string
  collection_id: string
  post_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  profiles: PostAuthor
  like_count?: number
  liked_by_me?: boolean
  replies?: PostComment[]
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  created_at: string
  last_message_at: string
  participants: ConversationParticipant[]
  last_message?: Message | null
  unread_count?: number
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  last_read_at: string | null
  profiles: {
    id: string
    username: string
    display_name: string | null
    full_name: string | null
    avatar_color: number
    avatar_url: string | null
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  profiles?: {
    id: string
    username: string
    display_name: string | null
    full_name: string | null
    avatar_color: number
    avatar_url: string | null
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = 'like' | 'comment' | 'follow' | 'verify_approved' | 'verify_rejected' | 'verify_revoked' | 'mention' | 'friend_request' | 'friend_accepted' | 'post_deleted' | 'post_warned' | 'upgrade_approved' | 'upgrade_rejected' | 'tier_downgraded'

export interface Notification {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  post_id: string | null
  message: string | null
  read: boolean
  created_at: string
  actor?: {
    username: string
    display_name: string | null
    full_name: string | null
    avatar_color: number
    avatar_url: string | null
  }
  post?: {
    body: string | null
    media_url: string | null
  }
}

export interface ProfileStats {
  user_id: string
  username: string
  post_count: number
  follower_count: number
  following_count: number
}

// ── Subscription tiers ────────────────────────────────────────────────────────
// main_admin is resolved from email in app code; DB stores normal/pro/premium/admin
export type SubscriptionTier = 'normal' | 'pro' | 'premium' | 'admin' | 'main_admin'

export interface Subscription {
  id: string
  user_id: string
  tier: Exclude<SubscriptionTier, 'main_admin'>
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  note: string | null
  created_at: string
}

export interface SubscriptionRow extends Subscription {
  profile: {
    display_name: string | null
    username: string | null
    avatar_color: number
    avatar_url: string | null
  } | null
}
