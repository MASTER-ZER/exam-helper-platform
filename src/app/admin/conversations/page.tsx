'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Eye, Copy, Trash2, Loader2, ExternalLink } from 'lucide-react'

interface Conversation {
  id: string
  user_id: string
  title: string | null
  status: string
  created_at: string
  uploads: {
    id: string
    image_url: string
    ai_response: string | null
    telegram_sent: boolean
    ai_status: string
    error_message: string | null
    created_at: string
  }[]
  profile: {
    full_name: string
    email: string
    avatar_url: string
  }
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Conversation | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    const supabase = createClient()
    const { data } = await supabase
      .from('exam_conversations')
      .select('*, uploads:exam_uploads(*), profile:profiles(full_name, email, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setConversations(data as unknown as Conversation[])
    setLoading(false)
  }

  async function deleteConversation(id: string) {
    const res = await fetch(`/api/admin/conversations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      setSelected(null)
      toast.success('تم حذف المحادثة')
    } else {
      toast.error('فشل حذف المحادثة')
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
    toast.success('تم النسخ')
  }

  const filtered = conversations.filter((c) =>
    c.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div dir="rtl">
      <h1 className="mb-6 text-2xl font-bold">كل المحادثات</h1>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم الطالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="hidden md:table-cell">حالة AI</TableHead>
                <TableHead className="hidden md:table-cell">تليجرام</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    لا توجد محادثات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((conv) => (
                  <TableRow key={conv.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{conv.profile?.full_name || 'غير معروف'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(conv.created_at).toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          conv.uploads?.[0]?.ai_status === 'completed'
                            ? 'default'
                            : conv.uploads?.[0]?.ai_status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {conv.uploads?.[0]?.ai_status === 'completed'
                          ? 'تم'
                          : conv.uploads?.[0]?.ai_status === 'failed'
                            ? 'فشل'
                            : conv.uploads?.[0]?.ai_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={conv.uploads?.[0]?.telegram_sent ? 'default' : 'secondary'}>
                        {conv.uploads?.[0]?.telegram_sent ? 'تم' : 'لا'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelected(conv)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المحادثة</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Student info */}
              <div className="rounded-lg bg-muted p-4">
                <p className="font-bold">{selected.profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{selected.profile?.email}</p>
              </div>

              {/* Image */}
              {selected.uploads?.[0]?.image_url && (
                <div>
                  <img
                    src={selected.uploads[0].image_url}
                    alt="Exam"
                    className="max-h-96 w-full rounded-lg object-contain"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selected.uploads[0].image_url, '_blank')}
                    >
                      <ExternalLink className="ml-1 h-3 w-3" />
                      فتح الصورة
                    </Button>
                  </div>
                </div>
              )}

              {/* Technical data */}
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p><strong>Conversation ID:</strong> {selected.id}</p>
                <p><strong>Upload ID:</strong> {selected.uploads?.[0]?.id}</p>
                <p><strong>User ID:</strong> {selected.user_id}</p>
                <p><strong>تاريخ الإنشاء:</strong> {new Date(selected.created_at).toLocaleString('ar-EG')}</p>
                <p><strong>حالة AI:</strong> {selected.uploads?.[0]?.ai_status}</p>
                <p><strong>حالة التليجرام:</strong> {selected.uploads?.[0]?.telegram_sent ? 'تم الإرسال' : 'لم يتم'}</p>
              </div>

              {/* AI Response */}
              {selected.uploads?.[0]?.ai_response && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-bold">رد AI</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(selected.uploads[0].ai_response!)}
                    >
                      <Copy className="ml-1 h-3 w-3" />
                      نسخ
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-card p-4 whitespace-pre-wrap text-sm leading-relaxed">
                    {selected.uploads[0].ai_response}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => deleteConversation(selected.id)}
                >
                  <Trash2 className="ml-1 h-4 w-4" />
                  حذف المحادثة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
