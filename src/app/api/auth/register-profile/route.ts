import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewUserNotification } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { full_name, email, password, phone, governorate, birth_date, avatar_base64, avatar_ext } = body

    // Validation
    if (!full_name || !password || !phone || !governorate || !birth_date) {
      return NextResponse.json(
        { error: 'يرجى إدخال جميع الحقول الإجبارية' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Generate email if not provided
    const userEmail = email && email.trim()
      ? email.trim()
      : `student_${phone.replace(/[^0-9]/g, '')}_${Date.now()}@brshama.com`

    // Create user in Auth (auto-confirmed)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ error: 'فشل إنشاء الحساب' }, { status: 500 })
    }

    const userId = authData.user.id

    // Upload avatar if provided
    let avatarUrl = ''
    if (avatar_base64 && avatar_ext) {
      try {
        const buffer = Buffer.from(avatar_base64, 'base64')
        const filePath = `${userId}/avatar.${avatar_ext}`

        const { error: uploadError } = await adminClient.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: `image/${avatar_ext === 'jpg' ? 'jpeg' : avatar_ext}`,
            upsert: true,
          })

        if (!uploadError) {
          const { data: urlData } = adminClient.storage
            .from('avatars')
            .getPublicUrl(filePath)
          avatarUrl = urlData.publicUrl
        }
      } catch {
        // Avatar upload failed, continue without avatar
      }
    }

    // Create profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId,
      full_name,
      email: userEmail,
      phone,
      governorate,
      birth_date,
      avatar_url: avatarUrl,
      plan: 'free',
      role: 'student',
    })

    if (profileError) {
      return NextResponse.json({ error: 'فشل حفظ بيانات المستخدم' }, { status: 500 })
    }

    // Send Telegram notification (fire and forget)
    sendNewUserNotification({
      full_name,
      email: userEmail,
      phone,
      governorate,
      birth_date,
      plan: 'free',
      user_id: userId,
      avatar_url: avatarUrl,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        avatar_url: avatarUrl,
      },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
