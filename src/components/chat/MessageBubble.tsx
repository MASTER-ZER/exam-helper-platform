'use client'

import { Bot, User } from 'lucide-react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string | null
}

export function MessageBubble({ role, content, imageUrl }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 animate-in fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] space-y-2 md:max-w-[70%]`}>
        {imageUrl && (
          <div className="overflow-hidden rounded-lg border">
            <img
              src={imageUrl}
              alt="صورة السؤال"
              className="max-h-60 w-full object-contain"
            />
          </div>
        )}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        }`}>
          {content}
        </div>
      </div>
    </div>
  )
}
