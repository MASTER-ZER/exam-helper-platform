import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const adminSupabase = createAdminClient()
    const { id } = await params
    const { data, error } = await adminSupabase.from('profiles').select('*').eq('id', id).single()

    if (error) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    return NextResponse.json({ student: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
