import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Step 2: Try to configure Google OAuth via GoTrue API
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const srvKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const headers: Record<string, string> = {
      'apikey': anonKey,
      'Authorization': `Bearer ${srvKey}`,
      'Content-Type': 'application/json',
    }

    // Read current settings
    const getRes = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers })
    if (getRes.ok) {
      const settings = await getRes.json()
      results.push(`Current Google OAuth setting: google=${settings.external?.google}`)

      // Try to update via the Supabase Management API approach
      // Using the direct GoTrue settings endpoint (may fail with 405)
      const updateBody = {
        external: {
          google: {
            enabled: true,
            client_id: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET,
          }
        }
      }

      const putRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateBody),
      })

      if (putRes.ok) {
        results.push('Google OAuth configured successfully via GoTrue API')
      } else {
        const putText = await putRes.text()
        errors.push(`GoTrue PUT settings returned ${putRes.status}: ${putText.substring(0, 200)}`)
        results.push('Google OAuth needs manual setup in Supabase Dashboard → Authentication → Providers → Google')
      }
    } else {
      errors.push(`Failed to read auth settings: ${getRes.status}`)
    }
  } catch (oauthErr: unknown) {
    errors.push(`OAuth config error: ${oauthErr instanceof Error ? oauthErr.message : String(oauthErr)}`)
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors,
    instructions: errors.length > 0 ? [
      '1. Go to Supabase Dashboard → SQL Editor → Run: ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);',
      '2. Go to Supabase Dashboard → Authentication → Providers → Google → Enable → Enter Client ID and Secret',
    ] : [],
  })
}
