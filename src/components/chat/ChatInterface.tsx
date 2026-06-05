'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './MessageBubble'
import { Loader2, Send, ImagePlus, ArrowDown, Bot } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  image_url: string | null
  created_at: string
}

interface ChatInterfaceProps {
  conversationId: string | null
  onNewConversation?: (id: string) => void
}

export function ChatInterface({ conversationId, onNewConversation }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
    } else {
      setMessages([])
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleScroll() {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200)
  }

  async function loadMessages(convId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/chat/messages?conversation_id=${convId}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch {
      toast.error('فشل تحميل الرسائل')
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('الصيغ المسموحة: JPG, PNG, WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('الحد الأقصى 5MB')
      return
    }
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend() {
    if (!input.trim() && !selectedFile) return
    setSending(true)

    try {
      let imageBase64: string | undefined
      let filePath: string | undefined

      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop()
        filePath = `${conversationId || 'new'}/${Date.now()}.${ext}`
        const buffer = await selectedFile.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        bytes.forEach((b) => (binary += String.fromCharCode(b)))
        imageBase64 = btoa(binary)
      }

      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          text: input.trim() || undefined,
          image_base64: imageBase64,
          file_path: filePath,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل الإرسال')
      }

      // Add user message and AI response to local state
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        image_url: preview,
        created_at: new Date().toISOString(),
      }
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        image_url: null,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg, aiMsg])
      setInput('')
      removeSelectedFile()

      if (onNewConversation && !conversationId) {
        onNewConversation(data.conversation_id)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4 md:px-6"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Bot className="mb-4 h-12 w-12" />
            <p className="text-lg font-medium">ابدأ محادثة جديدة</p>
            <p className="text-sm mt-1">اكتب سؤالك أو ارفع صورة امتحان</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                imageUrl={msg.image_url}
              />
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition hover:opacity-90"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Image preview */}
      {preview && (
        <div className="relative mx-3 border-t bg-background p-2 md:mx-6">
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
            <button
              onClick={removeSelectedFile}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-background p-3 pb-6 md:p-4 md:pb-4">
        <div className="mx-auto flex max-w-4xl items-end gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              rows={1}
              disabled={sending}
              className="flex w-full resize-none rounded-2xl border bg-muted px-4 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[44px] max-h-32"
            />
          </div>
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || sending}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
