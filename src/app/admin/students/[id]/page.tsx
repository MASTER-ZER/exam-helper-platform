'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Eye, Copy, Trash2, ExternalLink, CheckCircle2, AlertCircle, ArrowUp, Ban, UserCheck, RefreshCw, Calendar, Phone, Mail, MapPin, ImageIcon, MessageSquare } from 'lucide-react'
import type { Profile, ExamConversation, ExamUpload } from '@/types'

interface ConversationWithUploads extends ExamConversation {
  uploads: ExamUpload[]
}

export default function StudentDetailPage() {
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<ConversationWithUploads[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [selectedConversation, setSelectedConversation] = useState<ConversationWithUploads | null>(null)
  const [selectedUpload, setSelectedUpload] = useState<ExamUpload | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const loadStudent = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single()
    setStudent(data as Profile | null)
  }, [studentId])

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}/conversations`)
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : data.conversations || [])
    } catch {
      setConversations([])
    }
  }, [studentId])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadStudent(), loadConversations()])
      setLoading(false)
    }
    init()
  }, [loadStudent, loadConversations])

  async function handleAction(action: string, endpoint: string, body: object) {
    setActionLoading(action)
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('فشلت العملية')
      toast.success('تم بنجاح')
      await loadStudent()
    } catch {
      toast.error('حدث خطأ أثناء تنفيذ العملية')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المحادثة؟')) return
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('فشل الحذف')
      toast.success('تم حذف المحادثة بنجاح')
      setDialogOpen(false)
      setSelectedConversation(null)
      setSelectedUpload(null)
      await loadConversations()
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  function handleViewConversation(conv: ConversationWithUploads) {
    setSelectedConversation(conv)
    setSelectedUpload(conv.uploads?.[0] || null)
    setCopySuccess(false)
    setDialogOpen(true)
  }

  async function handleCopyResponse(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      toast.success('تم نسخ الرد')
    } catch {
      toast.error('فشل النسخ')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        الطالب غير موجود
      </div>
    )
  }

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      {student.plan === 'free' ? (
        <Button
          size="sm"
          onClick={() => handleAction('upgrade', `/api/admin/users/${studentId}/plan`, { plan: 'paid' })}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'upgrade' ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <ArrowUp className="h-4 w-4 ml-1" />}
          ترقية إلى مدفوع
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('downgrade', `/api/admin/users/${studentId}/plan`, { plan: 'free' })}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'downgrade' ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <ArrowUp className="h-4 w-4 ml-1" />}
          تخفيض إلى مجاني
        </Button>
      )}
      {student.is_banned ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('unban', `/api/admin/users/${studentId}/ban`, { is_banned: false })}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'unban' ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <UserCheck className="h-4 w-4 ml-1" />}
          إلغاء الحظر
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction('ban', `/api/admin/users/${studentId}/ban`, { is_banned: true })}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'ban' ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Ban className="h-4 w-4 ml-1" />}
          حظر المستخدم
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => handleAction('reset', `/api/admin/users/${studentId}/plan`, { plan: student.plan })}
        disabled={actionLoading !== null}
      >
        {actionLoading === 'reset' ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <RefreshCw className="h-4 w-4 ml-1" />}
        إعادة تعيين عداد الرفع
      </Button>
    </div>
  )

  return (
    <div dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={student.avatar_url || undefined} />
            <AvatarFallback>{(student.full_name || '?').charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{student.full_name}</h1>
            <p className="text-sm text-muted-foreground">معرف المستخدم: {student.id}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="mb-6">
        <TabsList>
          <TabsTrigger value="info">معلومات الطالب</TabsTrigger>
          <TabsTrigger value="conversations">المحادثات</TabsTrigger>
          <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الطالب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                    <p className="font-medium">{student.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">المحافظة</p>
                    <p className="font-medium">{student.governorate || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ الميلاد</p>
                    <p className="font-medium">
                      {student.birth_date ? new Date(student.birth_date).toLocaleDateString('ar-EG') : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ التسجيل</p>
                    <p className="font-medium">
                      {new Date(student.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">آخر رفع</p>
                    <p className="font-medium">
                      {student.last_upload_date
                        ? new Date(student.last_upload_date).toLocaleDateString('ar-EG')
                        : 'لا يوجد'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">الخطة</p>
                  <Badge variant={student.plan === 'paid' ? 'default' : 'secondary'} className="mt-1">
                    {student.plan === 'paid' ? 'مدفوع' : 'مجاني'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">حالة الحساب</p>
                  <Badge variant={student.is_banned ? 'destructive' : 'outline'} className="mt-1">
                    {student.is_banned ? 'محظور' : 'نشط'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">عدد مرات الرفع اليوم</p>
                  <p className="mt-1 font-medium">{student.daily_upload_count}</p>
                </div>
              </div>
              {actionButtons}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>المحادثات</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
                  لا توجد محادثات
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv, idx) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          {conv.uploads?.[0]?.image_url ? (
                            <img
                              src={conv.uploads[0].image_url}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">محادثة #{conversations.length - idx}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.created_at).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            conv.status === 'completed'
                              ? 'default'
                              : conv.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {conv.status === 'completed'
                            ? 'مكتمل'
                            : conv.status === 'failed'
                              ? 'فشل'
                              : 'قيد الانتظار'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleViewConversation(conv)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل النشاط</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
                  لا توجد نشاطات
                </div>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute right-[7px] top-0 h-full w-0.5 bg-border" />
                  <div className="space-y-4">
                    <div className="relative flex gap-4">
                      <div className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">تسجيل الحساب</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(student.created_at).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>

                    {conversations.map((conv) => (
                      <div key={conv.id} className="relative flex gap-4">
                        <div className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-background">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">رفع امتحان</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.created_at).toLocaleString('ar-EG')}
                          </p>
                          <div className="mt-1 flex gap-2">
                            <Badge
                              variant={
                                conv.status === 'completed'
                                  ? 'default'
                                  : conv.status === 'failed'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="text-[10px]"
                            >
                              {conv.status === 'completed'
                                ? 'تم بنجاح'
                                : conv.status === 'failed'
                                  ? 'فشل'
                                  : 'قيد المعالجة'}
                            </Badge>
                            {conv.uploads?.[0]?.telegram_sent && (
                              <Badge variant="outline" className="text-[10px]">
                                تم الإرسال للتليجرام
                              </Badge>
                            )}
                          </div>
                          {conv.uploads?.[0]?.error_message && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              {conv.uploads[0].error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل المحادثة</DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <span>{new Date(selectedConversation.created_at).toLocaleString('ar-EG')}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUpload && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={selectedUpload.image_url}
                    alt="صورة الامتحان"
                    className="w-full object-contain"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedUpload.image_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 ml-1" />
                    فتح الصورة
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ الرفع</p>
                  <p className="text-sm">
                    {new Date(selectedUpload.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">حالة التليجرام</p>
                  <Badge variant={selectedUpload.telegram_sent ? 'default' : 'secondary'}>
                    {selectedUpload.telegram_sent ? 'تم الإرسال' : 'لم يتم الإرسال'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">حالة الذكاء الاصطناعي</p>
                  <Badge
                    variant={
                      selectedUpload.ai_status === 'completed'
                        ? 'default'
                        : selectedUpload.ai_status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {selectedUpload.ai_status === 'completed'
                      ? 'مكتمل'
                      : selectedUpload.ai_status === 'failed'
                        ? 'فشل'
                        : selectedUpload.ai_status === 'processing'
                          ? 'قيد المعالجة'
                          : 'قيد الانتظار'}
                  </Badge>
                </div>

                {selectedUpload.ai_response && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">رد الذكاء الاصطناعي</p>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleCopyResponse(selectedUpload.ai_response!)}
                      >
                        {copySuccess ? (
                          <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 ml-1" />
                        )}
                        {copySuccess ? 'تم النسخ' : 'نسخ'}
                      </Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-lg border bg-muted p-3 text-xs">
                      <pre className="whitespace-pre-wrap font-sans" dir="auto">
                        {selectedUpload.ai_response}
                      </pre>
                    </div>
                  </div>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteConversation(selectedConversation!.id)}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  حذف المحادثة
                </Button>
              </div>
            </div>
          )}

          {!selectedUpload && selectedConversation && (
            <div className="flex min-h-[100px] items-center justify-center text-muted-foreground">
              لا توجد مرفقات في هذه المحادثة
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
