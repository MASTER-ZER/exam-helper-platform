import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendExamUploadNotification } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, image_url, upload_id, profile } = body

    if (!user_id || !image_url || !upload_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send Telegram notification
    const telegramResult = await sendExamUploadNotification({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      governorate: profile.governorate,
      birth_date: profile.birth_date,
      upload_time: new Date().toLocaleString('ar-EG'),
      upload_id,
      image_url,
    })

    // Log telegram event
    const supabase = createAdminClient()
    await supabase.from('telegram_logs').insert({
      user_id,
      event_type: 'exam_upload',
      message_payload: body,
      success: telegramResult.ok,
      error_message: telegramResult.error || null,
    })

    // Update upload record with telegram status
    await supabase
      .from('exam_uploads')
      .update({ telegram_sent: telegramResult.ok })
      .eq('id', upload_id)

    return NextResponse.json({ success: true, telegram: telegramResult })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
