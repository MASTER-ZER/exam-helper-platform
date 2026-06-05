import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewUserNotification } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, full_name, email, phone, governorate, birth_date, avatar_url, plan } = body

    if (!user_id || !full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send Telegram notification
    const telegramResult = await sendNewUserNotification({
      full_name,
      email,
      phone,
      governorate,
      birth_date,
      plan: plan || 'free',
      user_id,
      avatar_url,
    })

    // Log telegram event
    const supabase = createAdminClient()
    await supabase.from('telegram_logs').insert({
      user_id,
      event_type: 'new_user_registration',
      message_payload: body,
      success: telegramResult.ok,
      error_message: telegramResult.error || null,
    })

    return NextResponse.json({ success: true, telegram: telegramResult })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
