'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  Loader2,
  ImagePlus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Brain,
  FileQuestion,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ExamConversation, ExamUpload, UploadStatus } from '@/types'

export default function DashboardPage() {
  const { user, profile, loading: userLoading } = useUser()
  const router = useRouter()
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [currentQuestionImage, setCurrentQuestionImage] = useState<string | null>(null)
  const [conversations, setConversations] = useState<(ExamConversation & { uploads: ExamUpload[] })[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [remainingUploads, setRemainingUploads] = useState(8)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  useEffect(() => {
    if (profile) {
      const freeLimit = 10
      const used = profile.daily_upload_count
      const today = new Date().toDateString()
      const lastUpload = profile.last_upload_date
        ? new Date(profile.last_upload_date).toDateString()
        : null

      if (today !== lastUpload) {
        setRemainingUploads(freeLimit)
      } else {
        setRemainingUploads(Math.max(0, freeLimit - (used || 0)))
      }

      loadConversations()
    }
  }, [profile])

  async function loadConversations() {
    if (!user) return
    const supabase = createClient()

    const { data } = await supabase
      .from('exam_conversations')
      .select('*, uploads:exam_uploads(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setConversations(data as unknown as (ExamConversation & { uploads: ExamUpload[] })[])
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

    if (remainingUploads <= 0) {
      toast.error('لقد وصلت للحد المجاني اليومي. قم بالترقية لمتابعة الحلول.')
      return
    }

    setUploadStatus('uploading')
    setShowUpload(true)

    try {
      const supabase = createClient()

      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${user!.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('exam-images')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error('فشل رفع الصورة')
      }

      const { data: urlData } = supabase.storage
        .from('exam-images')
        .getPublicUrl(filePath)

      const imageUrl = urlData.publicUrl
      setCurrentQuestionImage(imageUrl)
      setUploadStatus('processing')

      // Call API to process
      const res = await fetch('/api/exam/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          file_path: filePath,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل معالجة الصورة')
      }

      setAiResult(data.ai_response)
      setUploadStatus('completed')
      setRemainingUploads((prev) => prev - 1)
      toast.success('تم تحليل الصورة بنجاح!')
      loadConversations()
    } catch (err: unknown) {
      setUploadStatus('error')
      toast.error(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  if (userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8" dir="rtl">
      {/* Student Info */}
      <Card className="mb-4 md:mb-8 animate-slide-up">
        <CardContent className="flex flex-col items-center gap-4 p-4 text-center md:flex-row md:text-right md:gap-6 md:p-6">
          <Avatar className="h-16 w-16 md:h-20 md:w-20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold md:text-2xl">{profile?.full_name}</h1>
            <p className="text-sm text-muted-foreground md:text-base">{profile?.governorate}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
              <Badge variant={profile?.plan === 'paid' ? 'default' : 'secondary'}>
                {profile?.plan === 'paid' ? 'مدفوع' : 'مجاني'}
              </Badge>
              <Badge variant="outline">
                متبقي: {remainingUploads} رفعة
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Two Big Buttons */}
      <Card className="mb-4 md:mb-8 border-primary/20 animate-scale-in">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              onClick={() => router.push('/chat')}
              className="group relative h-28 flex-col gap-3 text-lg font-bold animate-pulse hover:animate-none"
            >
              <MessageCircle className="h-10 w-10" />
              <span>تكلم مع الـ AI</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUpload(!showUpload)}
              className="h-28 flex-col gap-3 text-lg font-bold border-primary/50"
            >
              <Upload className="h-10 w-10" />
              <span>ارفع صورة الامتحان</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      {showUpload && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع صورة السؤال
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadStatus === 'idle' && (
              <div className="flex flex-col items-center gap-4">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-12 hover:bg-muted/50">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">اختر صورة السؤال</p>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG, WebP - حد أقصى 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}

            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg">
                  {uploadStatus === 'uploading'
                    ? 'جاري رفع الصورة...'
                    : 'جاري تحليل الصورة باستخدام AI...'}
                </p>
              </div>
            )}

            {uploadStatus === 'completed' && aiResult && (
              <div className="space-y-4">
                {currentQuestionImage && (
                  <div className="mb-4">
                    <img
                      src={currentQuestionImage}
                      alt="السؤال"
                      className="max-h-96 rounded-lg object-contain"
                    />
                  </div>
                )}
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">نتيجة التحليل</h3>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {aiResult}
                  </div>
                </div>
                <Button onClick={() => {
                  setShowUpload(false)
                  setUploadStatus('idle')
                  setAiResult(null)
                  setCurrentQuestionImage(null)
                }}>
                  رفع سؤال آخر
                </Button>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex flex-col items-center gap-4 py-12">
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg text-destructive">حدث خطأ أثناء المعالجة</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadStatus('idle')
                    setAiResult(null)
                    setCurrentQuestionImage(null)
                  }}
                >
                  حاول مرة أخرى
                </Button>
              </div>
            )}

            {remainingUploads <= 0 && uploadStatus === 'idle' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <p className="text-center text-lg">
                  لقد وصلت للحد المجاني اليومي. قم بالترقية لمتابعة الحلول.
                </p>
                <Button onClick={() => router.push('/pricing')}>
                  عرض الباقات
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous Conversations */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            المحادثات السابقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
              <FileQuestion className="h-12 w-12" />
              <p>لا توجد محادثات سابقة</p>
              <p className="text-sm">ارفع أول صورة سؤال للبدء</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className="cursor-pointer transition hover:bg-muted/50"
                  onClick={() => {
                    setShowUpload(true)
                    setAiResult(conv.uploads?.[0]?.ai_response || null)
                    setCurrentQuestionImage(conv.uploads?.[0]?.image_url || null)
                    setUploadStatus('completed')
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-3 md:p-4">
                    {conv.uploads?.[0]?.image_url && (
                      <img
                        src={conv.uploads[0].image_url}
                        alt=""
                        className="h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">
                        {conv.title || `محادثة ${new Date(conv.created_at).toLocaleDateString('ar-EG')}`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs md:text-sm text-muted-foreground">
                        <span>{new Date(conv.created_at).toLocaleString('ar-EG')}</span>
                        {conv.uploads?.[0]?.ai_status === 'completed' ? (
                          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            محلولة
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            {conv.uploads?.[0]?.ai_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
