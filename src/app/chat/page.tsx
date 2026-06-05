'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  title: string
  created_at: string
}

export default function ChatPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  useEffect(() => {
    if (user) loadConversations()
  }, [user])

  async function loadConversations() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat/messages')
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations.map((c: any) => ({
          id: c.id,
          title: c.title || 'محادثة',
          created_at: c.created_at,
        })))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function handleNewConversation(id: string) {
    setSelectedId(id)
    setShowSidebar(false)
    loadConversations()
  }

  if (userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden" dir="rtl">
      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } fixed right-0 bottom-0 z-50 w-72 border-l bg-background transition-transform top-16 md:relative md:top-auto md:bottom-auto md:translate-x-0 md:border-l-0 md:border-r md:h-full`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-bold text-base">المحادثات</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedId(null)
                setShowSidebar(false)
              }}
            >
              <Plus className="h-4 w-4 ml-1" />
              جديد
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                لا توجد محادثات سابقة
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedId(conv.id)
                    setShowSidebar(false)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-right text-sm transition hover:bg-muted ${
                    selectedId === conv.id ? 'bg-muted font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(conv.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="relative flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center gap-2 border-b p-3 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(true)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <h1 className="font-bold">برشامه سمارت</h1>
        </div>

        {selectedId ? (
          <ChatInterface
            key={selectedId}
            conversationId={selectedId}
            onNewConversation={handleNewConversation}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-4 h-16 w-16" />
              <p className="text-lg font-medium">اختر محادثة أو ابدأ واحدة جديدة</p>
              <Button
                className="mt-4"
                onClick={() => setSelectedId('new')}
              >
                <Plus className="h-4 w-4 ml-2" />
                محادثة جديدة
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
