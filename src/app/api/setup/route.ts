import { NextResponse } from 'next/server'

export const maxDuration = 60

async function runSql(sql: string, connStr: string): Promise<string> {
  try {
    const pg = await import('pg')
    const { Pool } = pg.default || pg
    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    })
    const client = await pool.connect()
    try {
      await client.query(sql)
      return 'OK'
    } finally {
      client.release()
      await pool.end()
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('already exists')) return 'EXISTS'
    return `ERROR: ${msg}`
  }
}

export async function GET() {
  const results: string[] = []
  const errors: string[] = []

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return NextResponse.json({
      success: false,
      results: [],
      errors: ['DATABASE_URL not set in environment'],
      instructions: ['Go to Supabase Dashboard → SQL Editor → Run the full schema from supabase/schema.sql'],
    })
  }

  // Try pooler first, then direct connection
  const directUrl = databaseUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '')

  const fullSchema = `
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
  daily_upload_count int NOT NULL DEFAULT 0,
  last_upload_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_phone_key UNIQUE (phone);

CREATE TABLE IF NOT EXISTS exam_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  daily_limit int NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES exam_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telegram_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  message_payload jsonb,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_exam_conversations_user_id ON exam_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_uploads_conversation_id ON exam_uploads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_exam_uploads_user_id ON exam_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_created_at ON telegram_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

INSERT INTO plans (name, daily_limit, price) VALUES ('free', 10, 0) ON CONFLICT DO NOTHING;
INSERT INTO plans (name, daily_limit, price) VALUES ('paid', 50, 99) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_conversations_updated_at ON exam_conversations;
CREATE TRIGGER update_exam_conversations_updated_at
  BEFORE UPDATE ON exam_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

  // Try pooler connection
  let result = await runSql(fullSchema, databaseUrl)
  if (result === 'OK') {
    results.push('Full schema applied successfully via pooler')
  } else if (result === 'EXISTS') {
    results.push('Schema already exists (skipped)')
  } else {
    errors.push(`Pooler failed: ${result}`)
    // Try direct connection
    const directResult = await runSql(fullSchema, directUrl)
    if (directResult === 'OK') {
      results.push('Full schema applied successfully via direct connection')
    } else if (directResult === 'EXISTS') {
      results.push('Schema already exists (skipped)')
    } else {
      errors.push(`Direct connection also failed: ${directResult}`)
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors,
    instructions: errors.length > 0 ? ['Go to Supabase Dashboard → SQL Editor → Run the full schema from supabase/schema.sql'] : [],
  })
}
