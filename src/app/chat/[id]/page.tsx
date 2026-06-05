'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Loader2 } from 'lucide-react'

export default function ChatConversationPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  if (userLoading || !mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] md:min-h-[calc(100vh-4rem)]" dir="rtl">
      <ChatInterface
        key={id as string}
        conversationId={id as string}
        onNewConversation={(newId) => router.push(`/chat/${newId}`)}
      />
    </div>
  )
}
