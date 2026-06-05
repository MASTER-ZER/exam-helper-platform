-- Exam Helper Platform - RLS Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== PROFILES =====
-- Users can read their own profile, admins can read all
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

-- Users can insert their own profile (during registration)
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile, admins can update any
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin());

-- Only admins can delete profiles
CREATE POLICY "Admins delete profiles"
  ON profiles FOR DELETE
  USING (is_admin());

-- ===== EXAM CONVERSATIONS =====
-- Users see own conversations, admins see all
CREATE POLICY "Users read own conversations"
  ON exam_conversations FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Users can insert own conversations
CREATE POLICY "Users insert own conversations"
  ON exam_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own conversations, admins can update any
CREATE POLICY "Users update own conversations"
  ON exam_conversations FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

-- Admins can delete conversations
CREATE POLICY "Admins delete conversations"
  ON exam_conversations FOR DELETE
  USING (is_admin());

-- ===== EXAM UPLOADS =====
-- Users see own uploads, admins see all
CREATE POLICY "Users read own uploads"
  ON exam_uploads FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Users can insert own uploads
CREATE POLICY "Users insert own uploads"
  ON exam_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own uploads, admins can update any
CREATE POLICY "Users update own uploads"
  ON exam_uploads FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

-- Admins can delete uploads
CREATE POLICY "Admins delete uploads"
  ON exam_uploads FOR DELETE
  USING (is_admin());

-- ===== PLANS =====
-- Everyone can read plans
CREATE POLICY "Anyone read plans"
  ON plans FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify plans
CREATE POLICY "Admins insert plans"
  ON plans FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins update plans"
  ON plans FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins delete plans"
  ON plans FOR DELETE
  USING (is_admin());

-- ===== ADMIN LOGS =====
-- Only admins can read admin logs
CREATE POLICY "Admins read admin logs"
  ON admin_logs FOR SELECT
  USING (is_admin());

-- Admins can insert admin logs
CREATE POLICY "Admins insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (is_admin());

-- ===== TELEGRAM LOGS =====
-- Only admins can read telegram logs
CREATE POLICY "Admins read telegram logs"
  ON telegram_logs FOR SELECT
  USING (is_admin());

-- System/backend inserts telegram logs (will use service_role)
CREATE POLICY "System insert telegram logs"
  ON telegram_logs FOR INSERT
  WITH CHECK (true);

-- ===== CHAT MESSAGES =====
CREATE POLICY "Users read own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users insert own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System/backend can insert assistant messages (will use service_role)
CREATE POLICY "System insert assistant messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- ===== STORAGE POLICIES =====

-- Buckets: avatars (private)
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own avatar"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Buckets: exam-images (private)
CREATE POLICY "Users upload own exam images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exam-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own exam images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exam-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

CREATE POLICY "Admins read all exam images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exam-images'
    AND is_admin()
  );
