import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET() {
  const results: string[] = []
  const errors: string[] = []

  // Step 1: Run SQL migration via pg if DATABASE_URL is available
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    try {
      const pg = await import('pg')
      const { Pool } = pg.default || pg
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
      })
      const client = await pool.connect()
      try {
        await client.query(`ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);`)
        results.push('UNIQUE constraint on phone added successfully')
      } catch (sqlErr: unknown) {
        const msg = sqlErr instanceof Error ? sqlErr.message : String(sqlErr)
        if (msg.includes('already exists') || msg.includes('duplicate key')) {
          results.push('UNIQUE constraint on phone already exists (skipped)')
        } else {
          errors.push(`SQL error: ${msg}`)
        }
      }
      client.release()
      await pool.end()
    } catch (dbErr: unknown) {
      errors.push(`DB connection error: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`)
    }
  } else {
    errors.push('DATABASE_URL not set in environment')
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors,
    instructions: errors.length > 0 ? ['Go to Supabase Dashboard → SQL Editor → Run: ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);'] : [],
  })
}
