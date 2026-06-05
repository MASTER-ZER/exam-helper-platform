'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Plan } from '@/types'

export default function PricingPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    const supabase = createClient()
    const { data } = await supabase.from('plans').select('*').order('price', { ascending: true })
    if (data) setPlans(data as Plan[])
    setLoading(false)
  }

  if (loading || userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12" dir="rtl">
      <h1 className="mb-4 text-center text-4xl font-bold">الباقات</h1>
      <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-muted-foreground">
        اختر الباقة المناسبة لاحتياجاتك
      </p>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${plan.name === 'paid' ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.name === 'paid' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                الأكثر طلباً
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {plan.name === 'free' ? 'مجاني' : plan.name === 'paid' ? 'مدفوع' : plan.name}
              </CardTitle>
              <p className="text-center">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? 'مجاني' : `${plan.price} جنيه`}
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{plan.daily_limit} صورة يومياً</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>تحليل بالذكاء الاصطناعي</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>شرح خطوة بخطوة</span>
              </div>

              <Button
                className="w-full"
                variant={plan.name === 'paid' ? 'default' : 'outline'}
                onClick={() => {
                  if (!user) {
                    router.push('/register')
                  } else if (plan.name === 'free') {
                    toast.info('أنت حالياً على الباقة المجانية')
                  } else {
                    toast.info('للترقية، تواصل مع الإدارة')
                  }
                }}
              >
                {plan.price === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-3xl text-center">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-xl font-bold">ملاحظة</h2>
          <p className="text-muted-foreground">
            للترقية إلى الباقة المدفوعة، يرجى التواصل مع الإدارة.
            سنقوم بتفعيل الباقة يدوياً بعد التأكيد.
          </p>
        </div>
      </div>
    </div>
  )
}
