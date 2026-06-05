import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatWithAI } from '@/lib/gemini'
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (profile.is_banned) {
      return NextResponse.json({ error: 'حسابك محظور' }, { status: 403 })
    }

    const { conversation_id, text, image_base64, file_path } = await req.json()
    const mimeType = image_base64 ? getImageMimeType(file_path || 'image.jpg') : undefined

    // Get or create conversation
    let convId = conversation_id
    if (!convId) {
      const { data: conv, error: convErr } = await supabase
        .from('exam_conversations')
        .insert({
          user_id: user.id,
          title: text ? text.substring(0, 50) : `محادثة ${new Date().toLocaleDateString('ar-EG')}`,
          status: 'pending',
        })
        .select()
        .single()

      if (convErr) {
        return NextResponse.json({ error: 'فشل إنشاء المحادثة' }, { status: 500 })
      }
      convId = conv.id
    }

    // Load chat history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(50)

    // Check message limit (15 per conversation)
    if (convId) {
      const userMsgCount = (history || []).filter((m) => m.role === 'user').length
      if (userMsgCount >= 15) {
        return NextResponse.json(
          { error: 'لقد وصلت للحد الأقصى للرسائل في هذه المحادثة (15 رسالة). ابدأ محادثة جديدة.' },
          { status: 429 }
        )
      }
    }

    // Save user message
    const adminClient = createAdminClient()
    const { error: saveUserErr } = await adminClient.from('chat_messages').insert({
      conversation_id: convId,
      user_id: user.id,
      role: 'user',
      content: text || '',
      image_url: null,
    })
    if (saveUserErr) {
      return NextResponse.json(
        { error: `فشل حفظ رسالتك: ${saveUserErr.message}` },
        { status: 500 }
      )
    }

    // Upload image to storage if base64 provided
    let imageUrl: string | null = null
    if (image_base64 && file_path) {
      const buffer = Buffer.from(image_base64, 'base64')
      const { data: uploadData } = await adminClient.storage
        .from('exam-images')
        .upload(file_path, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        })

      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('exam-images')
          .getPublicUrl(file_path)
        imageUrl = urlData.publicUrl
      }
    }

    // Send initial upload notification if image provided
    if (imageUrl) {
      sendExamUploadNotification({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        governorate: profile.governorate,
        birth_date: profile.birth_date,
        upload_time: new Date().toLocaleString('ar-EG'),
        upload_id: convId,
        image_url: imageUrl,
      }).catch((e) => console.error('Chat upload Telegram notification failed:', e))
    }

    // Call AI with history
    const aiResult = await chatWithAI(
      (history || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content || '' })),
      text,
      image_base64,
      mimeType
    )

    if (!aiResult.success || !aiResult.text) {
      await supabase
        .from('exam_conversations')
        .update({ status: 'failed' })
        .eq('id', convId)

      return NextResponse.json(
        { error: aiResult.error || 'فشل معالجة الطلب' },
        { status: 500 }
      )
    }

    // Save AI response
    const { error: saveAIErr } = await adminClient.from('chat_messages').insert({
      conversation_id: convId,
      user_id: user.id,
      role: 'assistant',
      content: aiResult.text,
      image_url: null,
    })
    if (saveAIErr) {
      console.error('Failed to save AI response:', saveAIErr)
    }

    // Update conversation status
    await adminClient
      .from('exam_conversations')
      .update({ status: 'completed' })
      .eq('id', convId)

    // Send Telegram notification
    if (imageUrl) {
      sendAIResponseNotification({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        image_url: imageUrl,
        ai_response: aiResult.text,
        upload_id: convId,
      }).catch((e) => console.error('Chat send Telegram notification failed:', e))
    }

    return NextResponse.json({
      success: true,
      conversation_id: convId,
      response: aiResult.text,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
