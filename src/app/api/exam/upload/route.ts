import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { solveImageWithAI } from '@/lib/gemini'
import { sendExamUploadNotification, sendAIResponseNotification } from '@/lib/telegram'
import { getImageMimeType } from '@/lib/utils'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get profile to check ban status and limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (profile.is_banned) {
      return NextResponse.json(
        { error: 'حسابك محظور. تواصل مع الدعم.' },
        { status: 403 }
      )
    }

    // Check daily limit
    const planLimits: Record<string, number> = { free: 10, paid: 50 }
    const dailyLimit = planLimits[profile.plan] || 10

    const today = new Date().toDateString()
    const lastUpload = profile.last_upload_date
      ? new Date(profile.last_upload_date).toDateString()
      : null

    let currentCount = profile.daily_upload_count
    if (today !== lastUpload) {
      currentCount = 0
    }

    if (currentCount >= dailyLimit) {
      return NextResponse.json(
        { error: 'لقد وصلت للحد المجاني اليومي. قم بالترقية لمتابعة الحلول.' },
        { status: 429 }
      )
    }

    const { image_url, file_path } = await req.json()

    if (!image_url) {
      return NextResponse.json({ error: 'الصورة مطلوبة' }, { status: 400 })
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('exam_conversations')
      .insert({
        user_id: user.id,
        title: `محادثة ${new Date().toLocaleDateString('ar-EG')}`,
        status: 'pending',
      })
      .select()
      .single()

    if (convError) {
      return NextResponse.json({ error: 'فشل إنشاء المحادثة' }, { status: 500 })
    }

    // Create upload record
    const { data: upload, error: uploadError } = await supabase
      .from('exam_uploads')
      .insert({
        conversation_id: conversation.id,
        user_id: user.id,
        image_url,
        ai_status: 'processing',
      })
      .select()
      .single()

    if (uploadError) {
      return NextResponse.json({ error: 'فشل حفظ بيانات الرفع' }, { status: 500 })
    }

    // Fetch image and convert to base64
    let imageBase64: string
    let mimeType: string

    try {
      const imgRes = await fetch(image_url)
      const imgBuffer = await imgRes.arrayBuffer()
      imageBase64 = Buffer.from(imgBuffer).toString('base64')
      mimeType = getImageMimeType(file_path || 'image.jpg')
    } catch {
      return NextResponse.json(
        { error: 'فشل قراءة الصورة للمعالجة' },
        { status: 500 }
      )
    }

    // Send initial upload notification (before AI processing)
    sendExamUploadNotification({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      governorate: profile.governorate,
      birth_date: profile.birth_date,
      upload_time: new Date().toLocaleString('ar-EG'),
      upload_id: upload.id,
      image_url,
    }).catch((e) => console.error('Initial Telegram notification failed:', e))

    // Solve with AI
    const aiResult = await solveImageWithAI(imageBase64, mimeType)

    const adminClient = createAdminClient()

    if (aiResult.success) {
      // Update upload with AI response
      await adminClient
        .from('exam_uploads')
        .update({
          ai_response: aiResult.text,
          ai_status: 'completed',
        })
        .eq('id', upload.id)

      // Update conversation status
      await adminClient
        .from('exam_conversations')
        .update({ status: 'completed' })
        .eq('id', conversation.id)

      // Update daily upload count
      await adminClient
        .from('profiles')
        .update({
          daily_upload_count: today === lastUpload ? currentCount + 1 : 1,
          last_upload_date: new Date().toISOString(),
        })
        .eq('id', user.id)

      // Send Telegram notification after successful AI response
      try {
        const notifyResult = await sendAIResponseNotification({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          image_url,
          ai_response: aiResult.text || '',
          upload_id: upload.id,
        })
        if (!notifyResult.ok) console.error('AI response notify failed:', notifyResult.error)
      } catch (e) {
        console.error('AI response notify error:', e)
      }

      return NextResponse.json({
        success: true,
        conversation_id: conversation.id,
        upload_id: upload.id,
        ai_response: aiResult.text,
      })
    } else {
      // Update upload with error
      await adminClient
        .from('exam_uploads')
        .update({
          ai_status: 'failed',
          error_message: aiResult.error,
        })
        .eq('id', upload.id)

      await adminClient
        .from('exam_conversations')
        .update({ status: 'failed' })
        .eq('id', conversation.id)

      return NextResponse.json(
        {
          error: aiResult.error || 'فشل تحليل الصورة',
          ai_status: 'failed',
        },
        { status: 500 }
      )
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
