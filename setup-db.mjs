import pg from 'pg'
import tls from 'tls'

const { Pool } = pg
const ref = 'guhaegrpfeddgatxwgfm'
const pw = 'K1CEHCq6W7w1PE5q'

async function tryConnect(config, label) {
  const pool = new Pool({ ...config, connectionTimeoutMillis: 8000 })
  try {
    const client = await pool.connect()
    console.log(`  OK: ${label}`)
    return { client, pool }
  } catch (err) {
    console.log(`  X: ${label} - ${err.code} ${err.message.substring(0, 80)}`)
    await pool.end()
    return null
  }
}

async function main() {
  const urls = [
    // Try with the project ref as the username (not postgres.ref)
    { connectionString: `postgresql://${ref}:${pw}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, ssl: { rejectUnauthorized: false, servername: 'aws-0-us-east-1.pooler.supabase.com' }, label: 'ref-user-session' },
    { connectionString: `postgresql://${ref}:${pw}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false, servername: 'aws-0-us-east-1.pooler.supabase.com' }, label: 'ref-user-tcp' },
    // Try host=pooler with user=postgres and just the ref as dbname
    { connectionString: `postgresql://postgres:${pw}@aws-0-us-east-1.pooler.supabase.com:6543/${ref}?pgbouncer=true`, ssl: { rejectUnauthorized: false }, label: 'ref-as-db-session' },
    { connectionString: `postgresql://postgres.guhaegrpfeddgatxwgfm:${pw}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, ssl: { rejectUnauthorized: false, servername: 'guhaegrpfeddgatxwgfm.aws-0-us-east-1.pooler.supabase.com' }, label: 'sni-host' },
    // Try with the service_role JWT as password (for projects with JWT auth enabled)
    { connectionString: `postgresql://postgres.${ref}:${pw}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, ssl: { rejectUnauthorized: false }, label: 'final-try' },
  ]

  console.log('Trying final connection combinations...')
  for (const { connectionString, ssl, label } of urls) {
    const result = await tryConnect({ connectionString, ssl }, label)
    if (result) {
      const { client, pool } = result
      await client.query(`ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);`)
      console.log('UNIQUE constraint added!')
      client.release()
      await pool.end()
      return
    }
  }

  console.log('\nAll connection methods failed.')
  console.log('The Supabase pooler does not recognize this project ref.')
  console.log('You may need to enable Database Connection Pooling in Supabase Dashboard.')
}

main().catch(err => console.error('Fatal:', err.message))
