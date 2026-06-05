import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: current } = await adminClient
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()

    const newValue = !(current?.value === true)

    await adminClient
      .from('site_settings')
      .upsert({ key: 'maintenance_mode', value: newValue })

    return NextResponse.json({ success: true, maintenance: newValue })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'حدث خطأ' },
      { status: 500 }
    )
  }
}
