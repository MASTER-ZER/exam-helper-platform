import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { operation, amount } = await req.json()
    if (!['add', 'set'].includes(operation) || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { id } = await params

    // Get current coins
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('master_coins')
      .eq('id', id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const current = profile.master_coins ?? 0
    const newCoins = operation === 'add' ? current + amount : amount

    const { error } = await adminSupabase
      .from('profiles')
      .update({ master_coins: newCoins, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await adminSupabase.from('admin_logs').insert({
      admin_id: user.id,
      action: `coins_${operation}`,
      target_user_id: id,
      metadata: { operation, amount, previous: current, new: newCoins },
    })

    return NextResponse.json({ success: true, master_coins: newCoins })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
