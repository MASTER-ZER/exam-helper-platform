export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string
  governorate: string
  birth_date: string
  avatar_url: string
  plan: 'free' | 'paid'
  role: 'student' | 'admin'
  is_banned: boolean
  master_coins: number
  created_at: string
  updated_at: string
}

export interface ExamConversation {
  id: string
  user_id: string
  title: string | null
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  updated_at: string
}

export interface ExamUpload {
  id: string
  conversation_id: string
  user_id: string
  image_url: string
  ai_response: string | null
  telegram_sent: boolean
  ai_status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
}

export interface Plan {
  id: string
  name: string
  daily_limit: number
  price: number
  created_at: string
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_user_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface TelegramLog {
  id: string
  user_id: string | null
  event_type: string
  message_payload: Record<string, unknown> | null
  success: boolean
  error_message: string | null
  created_at: string
}

export interface RegisterFormData {
  full_name: string
  email: string
  password: string
  phone: string
  governorate: string
  birth_date: string
  avatar: File | null
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
