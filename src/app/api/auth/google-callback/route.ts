import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '382029459424-9uf56jhfki59equnr26lq3qa5gnjh3po.apps.googleusercontent.com'
)

export async function POST(req: Request) {
  try {
    const { credential, nonce } = await req.json()

    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
    }

    // Verify nonce
    if (nonce) {
      const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-secret'
      const parts = nonce.split('.')
      if (parts.length === 2) {
        const expectedSig = crypto.createHmac('sha256', secret).update(parts[0]).digest('hex')
        if (expectedSig !== parts[1]) {
          return NextResponse.json({ error: 'Invalid nonce' }, { status: 400 })
        }
      }
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || '382029459424-9uf56jhfki59equnr26lq3qa5gnjh3po.apps.googleusercontent.com',
    })

    const payload = ticket.getPayload()
    if (!payload?.sub || !payload?.email) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 })
    }

    const { sub: googleId, email, name, picture } = payload

    // Use Supabase admin client to find or create user
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Look up existing user by email
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, full_name, email, phone, governorate, birth_date, avatar_url, plan')
      .eq('email', email)
      .maybeSingle()

    let userId: string
    let profileExists = !!existingProfile

    if (existingProfile) {
      userId = existingProfile.id
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name || '' },
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      userId = authData.user.id

      // Create profile
      const { error: profileError } = await adminClient.from('profiles').insert({
        id: userId,
        full_name: name || email.split('@')[0],
        email,
        phone: '',
        governorate: '',
        birth_date: '2000-01-01',
        avatar_url: picture || '',
        plan: 'free',
        role: 'student',
      })

      if (profileError && !profileError.message?.includes('duplicate')) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
    }

    // Create session via GoTrue admin API
    const srvKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    const sessionRes = await fetch(`${supabaseUrl}/auth/v1/admin/sessions`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${srvKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    })

    let accessToken = ''
    let refreshToken = ''

    if (sessionRes.ok) {
      const sessionData = await sessionRes.json()
      accessToken = sessionData.access_token || sessionData.accessToken || ''
      refreshToken = sessionData.refresh_token || sessionData.refreshToken || ''
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      user: {
        id: userId,
        email,
        name: name || email.split('@')[0],
        avatar_url: picture || '',
      },
      needs_profile: !profileExists || !existingProfile?.phone,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Google authentication failed' },
      { status: 400 }
    )
  }
}
