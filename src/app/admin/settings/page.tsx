'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [testingTelegram, setTestingTelegram] = useState(false)
  const [testingAI, setTestingAI] = useState(false)
  const [testingGROQ, setTestingGROQ] = useState(false)
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [aiStatus, setAiStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [groqStatus, setGroqStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [telegramMsg, setTelegramMsg] = useState('')
  const [aiMsg, setAiMsg] = useState('')
  const [groqMsg, setGroqMsg] = useState('')

  async function testConnection(url: string, setStatus: any, setMsg: any, setLoading: any, label: string) {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        setMsg('تم الاتصال بنجاح')
        toast.success(`${label} متصل`)
      } else {
        setStatus('error')
        setMsg(data.error || 'فشل الاتصال')
        toast.error(`${label}: ${data.error || 'فشل الاتصال'}`)
      }
    } catch {
      setStatus('error')
      setMsg('خطأ في الاتصال')
      toast.error(`فشل الاتصال بـ ${label}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl">
      <h1 className="mb-6 text-2xl font-bold">الإعدادات</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Telegram Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات التليجرام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <Input value="••••••••••••••••" disabled dir="ltr" />
              <p className="text-xs text-muted-foreground">التوكن مخفي. يتم ضبطه في متغيرات البيئة.</p>
            </div>
            <div className="flex items-center justify-between">
              <Button onClick={() => testConnection('/api/admin/test-telegram', setTelegramStatus, setTelegramMsg, setTestingTelegram, 'التليجرام')} disabled={testingTelegram}>
                {testingTelegram && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                اختبار التليجرام
              </Button>
              {telegramStatus !== 'idle' && (
                <Badge variant={telegramStatus === 'success' ? 'default' : 'destructive'}>
                  {telegramStatus === 'success' ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> متصل</span>
                  ) : (
                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> {telegramMsg}</span>
                  )}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vision API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>معالجة الصور والذكاء الاصطناعي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input value="••••••••••••••••" disabled dir="ltr" />
              <p className="text-xs text-muted-foreground">يستخدم OCR محلي لاستخراج النص + Gemini للحل</p>
            </div>
            <div className="flex items-center justify-between">
              <Button onClick={() => testConnection('/api/admin/test-groq', setGroqStatus, setGroqMsg, setTestingGROQ, 'Vision API')} disabled={testingGROQ}>
                {testingGROQ && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                اختبار Vision
              </Button>
              {groqStatus !== 'idle' && (
                <Badge variant={groqStatus === 'success' ? 'default' : 'destructive'}>
                  {groqStatus === 'success' ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> متصل</span>
                  ) : (
                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> {groqMsg}</span>
                  )}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gemini AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الذكاء الاصطناعي (Gemini 3.5 Flash)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input value="••••••••••••••••" disabled dir="ltr" />
              <p className="text-xs text-muted-foreground">يستخدم لقراءة الصور وحل الأسئلة مباشرة (Gemini 3.5 Flash)</p>
            </div>
            <div className="flex items-center justify-between">
              <Button onClick={() => testConnection('/api/admin/test-ai', setAiStatus, setAiMsg, setTestingAI, 'AI')} disabled={testingAI}>
                {testingAI && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                اختبار AI
              </Button>
              {aiStatus !== 'idle' && (
                <Badge variant={aiStatus === 'success' ? 'default' : 'destructive'}>
                  {aiStatus === 'success' ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> متصل</span>
                  ) : (
                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> {aiMsg}</span>
                  )}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
