import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewUserNotification } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, full_name, phone, governorate, birth_date, avatar_base64, avatar_ext } = body

    if (!user_id || !full_name || !phone || !governorate || !birth_date) {
      return NextResponse.json(
        { error: 'يرجى إدخال جميع الحقول الإجبارية' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get user email from auth
    const { data: { user } } = await adminClient.auth.admin.getUserById(user_id)
    if (!user?.email) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 400 })
    }

    // Upload avatar if provided
    let avatarUrl = ''
    if (avatar_base64 && avatar_ext) {
      try {
        const buffer = Buffer.from(avatar_base64, 'base64')
        const filePath = `${user_id}/avatar.${avatar_ext}`

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
        // Avatar upload failed, continue
      }
    }

    // Create profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: user_id,
      full_name,
      email: user.email,
      phone,
      governorate,
      birth_date,
      avatar_url: avatarUrl,
      plan: 'free',
      role: 'student',
    })

    if (profileError) {
      if (profileError.message?.includes('duplicate key') || profileError.code === '23505') {
        return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل' }, { status: 409 })
      }
      return NextResponse.json({ error: 'فشل حفظ بيانات المستخدم' }, { status: 500 })
    }

    // Send Telegram notification (fire and forget)
    sendNewUserNotification({
      full_name,
      email: user.email,
      phone,
      governorate,
      birth_date,
      plan: 'free',
      user_id,
      avatar_url: avatarUrl,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
