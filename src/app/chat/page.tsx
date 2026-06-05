'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Loader2 } from 'lucide-react'

export default function ChatPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  if (userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)]" dir="rtl">
      <ChatInterface conversationId={null} />
    </div>
  )
}
