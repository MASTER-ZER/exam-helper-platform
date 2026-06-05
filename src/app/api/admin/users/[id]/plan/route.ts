import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { plan } = await req.json()
    if (!['free', 'paid'].includes(plan)) {
      return NextResponse.json({ error: 'خطة غير صالحة' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { id } = await params

    const { error } = await adminSupabase
      .from('profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log admin action
    await adminSupabase.from('admin_logs').insert({
      admin_id: user.id,
      action: `change_plan_to_${plan}`,
      target_user_id: id,
      metadata: { plan },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
