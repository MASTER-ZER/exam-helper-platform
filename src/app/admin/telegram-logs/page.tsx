'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface TelegramLog {
  id: string
  user_id: string | null
  event_type: string
  message_payload: Record<string, unknown> | null
  success: boolean
  error_message: string | null
  created_at: string
}

export default function AdminTelegramLogsPage() {
  const [logs, setLogs] = useState<TelegramLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    const res = await fetch('/api/admin/telegram-logs')
    const data = await res.json()
    if (data.logs) setLogs(data.logs)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div dir="rtl">
      <h1 className="mb-6 text-2xl font-bold">سجل التليجرام</h1>

      <Card>
        <CardHeader>
          <CardTitle>رسائل التليجرام</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="hidden md:table-cell">رسالة الخطأ</TableHead>
                <TableHead className="hidden md:table-cell">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا توجد رسائل تليجرام
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="font-medium">
                        {log.event_type === 'new_user_registration'
                          ? 'تسجيل مستخدم جديد'
                          : log.event_type === 'exam_upload'
                            ? 'رفع امتحان'
                            : log.event_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            نجاح
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            فشل
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                      {log.error_message || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('ar-EG')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
