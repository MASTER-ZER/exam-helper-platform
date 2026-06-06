'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Profile } from '@/types'

interface StudentWithCount extends Profile {
  master_coins: number
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface StudentsResponse {
  students: StudentWithCount[]
  pagination: PaginationInfo
}

export default function AdminStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentWithCount[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [governorate, setGovernorate] = useState('all')
  const [plan, setPlan] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (governorate !== 'all') params.set('governorate', governorate)
      if (plan !== 'all') params.set('plan', plan)
      if (status !== 'all') params.set('status', status)
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('pageSize', '15')

      const res = await fetch(`/api/admin/students?${params.toString()}`)
      const data: StudentsResponse = await res.json()
      setStudents(data.students)
      setPagination(data.pagination)
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [search, governorate, plan, status, sort, page])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية',
    'القليوبية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ',
    'دمياط', 'بورسعيد', 'السويس', 'الإسماعيلية', 'المنيا',
    'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
    'الفيوم', 'بني سويف', 'مطروح', 'شمال سيناء', 'جنوب سيناء',
    'الوادي الجديد', 'البحر الأحمر',
  ]

  return (
    <div dir="rtl">
      <h1 className="mb-6 text-2xl font-bold">إدارة الطلاب</h1>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pr-9"
              />
            </div>
            <Select value={governorate} onValueChange={(v) => { setGovernorate(v || 'all'); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="المحافظة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المحافظات</SelectItem>
                {governorates.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={(v) => { setPlan(v || 'all'); setPage(1) }}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="الخطة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الخطط</SelectItem>
                <SelectItem value="free">مجاني</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v || 'all'); setPage(1) }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="banned">محظور</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v || 'newest'); setPage(1) }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="oldest">الأقدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
              لا يوجد طلاب
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right"></TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">البريد</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الهاتف</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">المحافظة</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">الخطة</TableHead>
                    <TableHead className="text-right hidden md:table-cell">ماستر كوين</TableHead>
                    <TableHead className="text-right hidden xl:table-cell">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Avatar size="sm">
                          <AvatarImage src={student.avatar_url || undefined} />
                          <AvatarFallback>{(student.full_name || '?').charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{student.phone || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{student.governorate || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={student.plan === 'paid' ? 'default' : 'secondary'}>
                          {student.plan === 'paid' ? 'مدفوع' : 'مجاني'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell" dir="ltr">
                        {student.master_coins}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden xl:table-cell">
                        {new Date(student.created_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.is_banned ? 'destructive' : 'outline'}>
                          {student.is_banned ? 'محظور' : 'نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/admin/students/${student.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    الصفحة {pagination.page} من {pagination.totalPages} ({pagination.total} طالب)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronRight className="h-4 w-4 ml-1" />
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= (pagination.totalPages || 1)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4 mr-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
