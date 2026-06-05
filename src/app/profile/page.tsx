'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, profile, loading } = useUser()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (profile) setFullName(profile.full_name)
  }, [profile])

  async function handleUpdateProfile() {
    if (!user) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      toast.error('فشل تحديث الملف الشخصي')
    } else {
      toast.success('تم تحديث الملف الشخصي')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={profile?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={profile?.phone || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>المحافظة</Label>
              <Input value={profile?.governorate || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الميلاد</Label>
              <Input value={profile?.birth_date || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>الخطة</Label>
              <Badge variant={profile?.plan === 'paid' ? 'default' : 'secondary'}>
                {profile?.plan === 'paid' ? 'مدفوع' : 'مجاني'}
              </Badge>
            </div>
          </div>

          <Button onClick={handleUpdateProfile} className="w-full" disabled={saving}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
