import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-secret'
  const nonce = crypto.randomUUID()
  const signature = crypto.createHmac('sha256', secret).update(nonce).digest('hex')
  return NextResponse.json({ nonce: `${nonce}.${signature}` })
}
