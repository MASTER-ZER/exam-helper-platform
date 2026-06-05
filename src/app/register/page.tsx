'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DatePicker } from '@/components/DatePicker'
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

export default function RegisterPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    governorate: '',
    birth_date: '',
    avatar: null as File | null,
  })

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

    if (!form.avatar) {
      toast.error('الصورة الشخصية مطلوبة')
      return
    }

    if (form.password !== form.confirm_password) {
      toast.error('كلمة المرور غير متطابقة')
      return
    }

    if (form.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)

    try {
      let avatar_base64 = ''
      let avatar_ext = ''
      if (form.avatar) {
        avatar_base64 = await fileToBase64(form.avatar)
        avatar_ext = form.avatar.name.split('.').pop() || 'jpg'
      }

      const res = await fetch('/api/auth/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          governorate: form.governorate,
          birth_date: form.birth_date,
          avatar_base64,
          avatar_ext,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'فشل إنشاء الحساب')
        setLoading(false)
        return
      }

      // Auto-login after registration
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.user.email,
        password: form.password,
      })

      if (signInError) {
        toast.success('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.')
        router.push('/login')
      } else {
        toast.success('تم إنشاء الحساب بنجاح!')
        router.push('/dashboard')
      }
    } catch {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8" dir="rtl">
      <Logo size={80} className="mb-6" />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">إنشاء حساب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <Avatar
                className="h-24 w-24 cursor-pointer ring-2 ring-primary/30"
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
              <p className="text-xs text-muted-foreground">* الصورة الشخصية مطلوبة</p>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com (اختياري)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  required
                  value={form.confirm_password}
                  onChange={(e) =>
                    setForm({ ...form, confirm_password: e.target.value })
                  }
                />
              </div>
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
              إنشاء الحساب
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
