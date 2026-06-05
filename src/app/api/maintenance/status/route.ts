import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    let isAdmin = false
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    }

    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()

    const maintenance = setting?.value === true

    return NextResponse.json({ maintenance, admin: isAdmin })
  } catch {
    return NextResponse.json({ maintenance: false, admin: false })
  }
}
