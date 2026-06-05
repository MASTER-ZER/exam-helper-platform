'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  UserPlus,
  ImageUp,
  MessageSquare,
  Snowflake,
  CreditCard,
  Ban,
  Loader2,
} from 'lucide-react'

interface OverviewStats {
  totalStudents: number
  newToday: number
  uploadsToday: number
  totalConversations: number
  freeUsers: number
  paidUsers: number
  bannedUsers: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentUploads, setRecentUploads] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const supabase = createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      { count: totalStudents },
      { count: newToday },
      { count: uploadsToday },
      { count: totalConversations },
      { count: freeUsers },
      { count: paidUsers },
      { count: bannedUsers },
      { data: recentUploadsData },
      { data: recentUsersData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('exam_uploads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('exam_conversations').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'paid'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      supabase.from('exam_uploads').select('*, profiles(full_name, avatar_url)').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
    ])

    setStats({
      totalStudents: totalStudents || 0,
      newToday: newToday || 0,
      uploadsToday: uploadsToday || 0,
      totalConversations: totalConversations || 0,
      freeUsers: freeUsers || 0,
      paidUsers: paidUsers || 0,
      bannedUsers: bannedUsers || 0,
    })

    setRecentUploads(recentUploadsData || [])
    setRecentUsers(recentUsersData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const statCards = [
    { title: 'إجمالي الطلاب', value: stats?.totalStudents || 0, icon: Users, color: 'text-blue-600' },
    { title: 'جديد اليوم', value: stats?.newToday || 0, icon: UserPlus, color: 'text-green-600' },
    { title: 'رفع اليوم', value: stats?.uploadsToday || 0, icon: ImageUp, color: 'text-purple-600' },
    { title: 'إجمالي المحادثات', value: stats?.totalConversations || 0, icon: MessageSquare, color: 'text-orange-600' },
    { title: 'المجاني', value: stats?.freeUsers || 0, icon: Snowflake, color: 'text-gray-600' },
    { title: 'المدفوع', value: stats?.paidUsers || 0, icon: CreditCard, color: 'text-emerald-600' },
    { title: 'المحظورين', value: stats?.bannedUsers || 0, icon: Ban, color: 'text-red-600' },
  ]

  return (
    <div dir="rtl">
      <h1 className="mb-6 text-2xl font-bold">نظرة عامة</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>آخر عمليات الرفع</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUploads.length === 0 ? (
              <p className="text-muted-foreground">لا توجد عمليات رفع</p>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(upload.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آخر المسجلين</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-muted-foreground">لا يوجد مستخدمين</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span>{u.full_name}</span>
                    <span className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
