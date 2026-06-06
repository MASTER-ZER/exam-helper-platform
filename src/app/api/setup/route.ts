import { NextResponse } from 'next/server'

export const maxDuration = 60

async function tryConnect(connStr: string): Promise<string | null> {
  try {
    const pg = await import('pg')
    const { Pool } = pg.default || pg
    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    })
    const client = await pool.connect()
    client.release()
    await pool.end()
    return null
  } catch (err: unknown) {
    return err instanceof Error ? err.message : String(err)
  }
}

async function runSql(sql: string, connStr: string, label: string): Promise<string> {
  const err = await tryConnect(connStr)
  if (err) return `Connection failed: ${err}`

  try {
    const pg = await import('pg')
    const { Pool } = pg.default || pg
    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
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
    return `SQL error: ${msg}`
  }
}

export async function GET() {
  const results: string[] = []
  const errors: string[] = []

  const supabaseRef = 'guhaegrpfeddgatxwgfm'
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  const databaseUrl = process.env.DATABASE_URL

  // Build all possible connection strings
  const attempts: { url: string; label: string }[] = []

  if (databaseUrl) {
    attempts.push({ url: databaseUrl, label: 'DATABASE_URL (pooler)' })
    const direct = databaseUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '')
    if (direct !== databaseUrl) {
      attempts.push({ url: direct, label: 'DATABASE_URL (direct port)' })
    }
  }

  if (dbPassword) {
    const pwd = encodeURIComponent(dbPassword)
    const hosts = [
      `${supabaseRef}.supabase.uno`,
      `db.${supabaseRef}.supabase.co`,
      `aws-0-us-east-1.pooler.supabase.com`,
      `aws-0-us-west-1.pooler.supabase.com`,
      `aws-0-eu-west-1.pooler.supabase.com`,
      `aws-0-eu-central-1.pooler.supabase.com`,
      `aws-0-me-south-1.pooler.supabase.com`,
    ]
    for (const host of hosts) {
      attempts.push({
        url: `postgresql://postgres.${supabaseRef}:${pwd}@${host}:6543/postgres?pgbouncer=true`,
        label: `pooler ${host}`,
      })
      attempts.push({
        url: `postgresql://postgres.${supabaseRef}:${pwd}@${host}:5432/postgres`,
        label: `direct ${host}`,
      })
    }
  }

  const fullSchema = `
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL, email text NOT NULL, phone text NOT NULL,
  governorate text NOT NULL, birth_date date NOT NULL, avatar_url text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_banned boolean NOT NULL DEFAULT false,
  master_coins int NOT NULL DEFAULT 10, last_daily_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS master_coins int NOT NULL DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_date date DEFAULT CURRENT_DATE;
ALTER TABLE profiles DROP COLUMN IF EXISTS daily_upload_count;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_upload_date;
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_phone_key UNIQUE (phone);
CREATE TABLE IF NOT EXISTS exam_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text, status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending','failed')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS exam_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES exam_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL, ai_response text, telegram_sent boolean NOT NULL DEFAULT false,
  ai_status text NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending','processing','completed','failed')),
  error_message text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, daily_limit int NOT NULL, price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL, target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES exam_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text, image_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS telegram_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL, message_payload jsonb,
  success boolean NOT NULL DEFAULT false, error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL DEFAULT 'false');
INSERT INTO site_settings (key, value) VALUES ('maintenance_mode', 'false') ON CONFLICT (key) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_exam_conversations_user_id ON exam_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
INSERT INTO plans (name, daily_limit, price) VALUES ('free', 10, 0) ON CONFLICT DO NOTHING;
INSERT INTO plans (name, daily_limit, price) VALUES ('paid', 50, 99) ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_exam_conversations_updated_at ON exam_conversations;
CREATE TRIGGER update_exam_conversations_updated_at BEFORE UPDATE ON exam_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

  // Try just chat_messages first (quicker)
  const chatTableSql = `
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES exam_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text, image_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
`

  let success = false

  for (const attempt of attempts) {
    if (success) break
    // Try chat_messages first
    let r = await runSql(chatTableSql, attempt.url, attempt.label)
    if (r === 'OK' || r === 'EXISTS') {
      results.push(`chat_messages created via ${attempt.label}`)
      success = true
      // Now try full schema
      r = await runSql(fullSchema, attempt.url, attempt.label)
      if (r === 'OK') results.push(`Full schema applied via ${attempt.label}`)
    } else {
      errors.push(`${attempt.label}: ${r}`)
    }
  }

  return NextResponse.json({
    success,
    results,
    errors,
    instructions: success
      ? ['تم إنشاء الجداول بنجاح']
      : [
          'ذهبت إلى Supabase Dashboard → SQL Editor → شغل: supabase/schema.sql',
          'أو استخدم الأمر: CREATE TABLE IF NOT EXISTS chat_messages (...);',
        ],
  })
}
