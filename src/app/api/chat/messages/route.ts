import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      // Return all conversations for user
      const { data: conversations } = await supabase
        .from('exam_conversations')
        .select(`
          *,
          messages:chat_messages(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      return NextResponse.json({ conversations: conversations || [] })
    }

    // Return messages for specific conversation
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const { data: conversation } = await supabase
      .from('exam_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    return NextResponse.json({
      conversation: conversation || null,
      messages: messages || [],
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
