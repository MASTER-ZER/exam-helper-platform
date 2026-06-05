'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { GoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleGoogleSuccess(credential: string) {
    const toastId = toast.loading('جاري تسجيل الدخول...')

    try {
      // Get nonce
      const nonceRes = await fetch('/api/auth/google-nonce')
      const { nonce } = await nonceRes.json()

      // Call backend
      const res = await fetch('/api/auth/google-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, nonce }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'فشل تسجيل الدخول بـ Google', { id: toastId })
        return
      }

      // Set Supabase session
      const supabase = createClient()
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      if (setSessionError) {
        toast.error('فشل إنشاء الجلسة', { id: toastId })
        return
      }

      toast.success('تم تسجيل الدخول بنجاح', { id: toastId })

      if (data.needs_profile) {
        router.push('/complete-profile')
      } else {
        router.push('/dashboard')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال بالخادم', { id: toastId })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    let loginEmail = form.email

    if (/^01[0-9]{9}$/.test(form.email)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', form.email)
        .maybeSingle()

      if (profile?.email) {
        loginEmail = profile.email
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: form.password,
    })

    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : error.message
      )
      setLoading(false)
      return
    }

    toast.success('تم تسجيل الدخول بنجاح')
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">تسجيل الدخول</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني أو رقم الهاتف</Label>
              <Input
                id="email"
                type="text"
                placeholder="البريد الإلكتروني أو رقم الهاتف"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تسجيل الدخول
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          <GoogleLogin
            onSuccess={({ credential }) => {
              if (credential) handleGoogleSuccess(credential)
            }}
            onError={() => toast.error('فشل تسجيل الدخول بـ Google')}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="100%"
          />

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-primary hover:underline">
              إنشاء حساب جديد
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
