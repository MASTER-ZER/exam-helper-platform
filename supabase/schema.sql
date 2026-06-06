-- Exam Helper Platform - Database Schema

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  governorate text NOT NULL,
  birth_date date NOT NULL,
  avatar_url text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_banned boolean NOT NULL DEFAULT false,
  master_coins int NOT NULL DEFAULT 10,
  last_daily_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Migration: daily_upload_count + last_upload_date → master_coins + last_daily_date
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS master_coins int NOT NULL DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_date date DEFAULT CURRENT_DATE;
ALTER TABLE profiles DROP COLUMN IF EXISTS daily_upload_count;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_upload_date;

-- Unique constraint on phone
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);

-- 2. Exam Conversations
CREATE TABLE IF NOT EXISTS exam_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Exam Uploads
CREATE TABLE IF NOT EXISTS exam_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES exam_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  ai_response text,
  telegram_sent boolean NOT NULL DEFAULT false,
  ai_status text NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Plans
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  daily_limit int NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES exam_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Telegram Logs
CREATE TABLE IF NOT EXISTS telegram_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  message_payload jsonb,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Site Settings (maintenance mode, etc)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'false'
);
INSERT INTO site_settings (key, value) VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_exam_conversations_user_id ON exam_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_uploads_conversation_id ON exam_uploads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_exam_uploads_user_id ON exam_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_created_at ON telegram_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Insert default plans
INSERT INTO plans (name, daily_limit, price) VALUES ('free', 10, 0) ON CONFLICT DO NOTHING;
INSERT INTO plans (name, daily_limit, price) VALUES ('paid', 50, 99) ON CONFLICT DO NOTHING;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_conversations_updated_at
  BEFORE UPDATE ON exam_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
