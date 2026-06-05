'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil } from 'lucide-react'
import type { Plan } from '@/types'

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState({ name: '', daily_limit: '', price: '' })

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    const supabase = createClient()
    const { data } = await supabase.from('plans').select('*').order('price', { ascending: true })
    if (data) setPlans(data as Plan[])
    setLoading(false)
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      daily_limit: plan.daily_limit.toString(),
      price: plan.price.toString(),
    })
    setShowDialog(true)
  }

  function openNew() {
    setEditingPlan(null)
    setForm({ name: '', daily_limit: '', price: '' })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!form.name || !form.daily_limit) {
      toast.error('يرجى إدخال جميع البيانات')
      return
    }

    const supabase = createClient()

    if (editingPlan) {
      const { error } = await supabase
        .from('plans')
        .update({
          name: form.name,
          daily_limit: parseInt(form.daily_limit),
          price: parseFloat(form.price) || 0,
        })
        .eq('id', editingPlan.id)

      if (error) {
        toast.error('فشل تحديث الخطة')
        return
      }
      toast.success('تم تحديث الخطة')
    } else {
      const { error } = await supabase.from('plans').insert({
        name: form.name,
        daily_limit: parseInt(form.daily_limit),
        price: parseFloat(form.price) || 0,
      })

      if (error) {
        toast.error('فشل إنشاء الخطة')
        return
      }
      toast.success('تم إنشاء الخطة')
    }

    setShowDialog(false)
    loadPlans()
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة الخطط</h1>
        <Button onClick={openNew}>
          <Plus className="ml-2 h-4 w-4" />
          خطة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الخطة</TableHead>
                <TableHead>الحد اليومي</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name === 'free' ? 'مجاني' : plan.name === 'paid' ? 'مدفوع' : plan.name}</TableCell>
                  <TableCell>{plan.daily_limit} صورة</TableCell>
                  <TableCell>{plan.price === 0 ? 'مجاني' : `${plan.price} جنيه`}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(plan.created_at).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'تعديل الخطة' : 'خطة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الخطة</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="free, paid, custom..."
              />
            </div>
            <div className="space-y-2">
              <Label>الحد اليومي (عدد الصور)</Label>
              <Input
                type="number"
                value={form.daily_limit}
                onChange={(e) => setForm({ ...form, daily_limit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
