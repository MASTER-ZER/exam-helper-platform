'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/DatePicker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

const governorates = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'الشرقية', 'الدقهلية',
  'البحيرة', 'المنيا', 'القليوبية', 'سوهاج', 'كفر الشيخ',
  'الغربية', 'أسيوط', 'المنوفية', 'الأقصر', 'أسوان',
  'بني سويف', 'الإسماعيلية', 'الفيوم', 'دمياط', 'بورسعيد',
  'السويس', 'قنا', 'مطروح', 'شمال سيناء', 'جنوب سيناء',
  'الوادي الجديد', 'البحر الأحمر',
]

export default function CompleteProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    governorate: '',
    birth_date: '',
    avatar: null as File | null,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      // Pre-fill name from Google metadata
      const meta = user.user_metadata
      setForm((prev) => ({
        ...prev,
        full_name: meta?.full_name || meta?.name || '',
      }))
      setChecking(false)
    })
  }, [router])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('يرجى رفع صورة بصيغة JPG أو PNG أو WebP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب ألا يتجاوز 5MB')
      return
    }

    setForm({ ...form, avatar: file })
    setPreviewUrl(URL.createObjectURL(file))
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً')
        router.push('/login')
        return
      }

      let avatar_base64 = ''
      let avatar_ext = ''
      if (form.avatar) {
        avatar_base64 = await fileToBase64(form.avatar)
        avatar_ext = form.avatar.name.split('.').pop() || 'jpg'
      }

      const res = await fetch('/api/auth/complete-oauth-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          full_name: form.full_name,
          phone: form.phone,
          governorate: form.governorate,
          birth_date: form.birth_date,
          avatar_base64,
          avatar_ext,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'فشل إتمام التسجيل')
        setLoading(false)
        return
      }

      toast.success('تم إتمام التسجيل بنجاح!')
      router.push('/dashboard')
    } catch {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8" dir="rtl">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">إكمال التسجيل</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            يرجى إكمال بياناتك للمتابعة
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar
                className="h-24 w-24 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <AvatarImage src={previewUrl || undefined} />
                <AvatarFallback>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                اختر صورة شخصية
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <Input
                id="full_name"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="الاسم كما تريد ظهوره"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                required
                placeholder="01xxxxxxxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>المحافظة</Label>
              <Select
                required
                value={form.governorate}
                onValueChange={(v) => setForm({ ...form, governorate: v || '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  {governorates.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تاريخ الميلاد</Label>
              <DatePicker
                value={form.birth_date}
                onChange={(d) => setForm({ ...form, birth_date: d })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إتمام التسجيل
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
