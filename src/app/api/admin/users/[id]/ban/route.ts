import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { is_banned } = await req.json()
    const adminSupabase = createAdminClient()
    const { id } = await params

    const { error } = await adminSupabase
      .from('profiles')
      .update({ is_banned, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await adminSupabase.from('admin_logs').insert({
      admin_id: user.id,
      action: is_banned ? 'ban_user' : 'unban_user',
      target_user_id: id,
      metadata: { is_banned },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
