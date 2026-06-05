'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, Brain, MessageCircle, Sparkles, GraduationCap, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: Upload,
    title: 'تصوير ورفع فوري',
    desc: 'صور الأسئلة والامتحانات بصيغ JPG, PNG, WebP واخلّي الـ AI يحلّهالك فوراً',
    gradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    icon: Brain,
    title: 'ذكاء اصطناعي متقدم',
    desc: 'Qwen + Gemini مع بعض عشان استخراج النص من الصور وحل الأسئلة خطوة بخطوة',
    gradient: 'from-purple-500/10 to-pink-500/10',
  },
  {
    icon: MessageCircle,
    title: 'دردشة تفاعلية',
    desc: 'اسأل و جاوب و احصل على شرح وافي مع إمكانية رفع صور إضافية',
    gradient: 'from-amber-500/10 to-orange-500/10',
  },
  {
    icon: GraduationCap,
    title: 'منهج وزارة التربية',
    desc: 'مخصص لطلاب تالتة إعدادي الترم الثاني – إجابات نموذجية حسب منهج الوزارة',
    gradient: 'from-green-500/10 to-emerald-500/10',
  },
  {
    icon: Sparkles,
    title: 'تيليجرام فوري',
    desc: 'الصورة توصل لحضرتك أولاً وبعدها الرد – متابعة كاملة لكل امتحان',
    gradient: 'from-violet-500/10 to-indigo-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'آمن وموثوق',
    desc: 'بياناتك محمية – استخدام يومي 10 مرات مجاناً',
    gradient: 'from-red-500/10 to-rose-500/10',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard')
      else setCheckingAuth(false)
    })
  }, [router])

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,200,0,0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="mb-4 text-4xl font-bold md:text-7xl bg-gradient-to-l from-primary to-amber-400 bg-clip-text text-transparent">
            برشامه سمارت
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base md:text-lg text-muted-foreground px-4">
            منصة تعليمية ذكية بحل الأسئلة والتدرب على الامتحانات باستخدام أحدث تقنيات الذكاء الاصطناعي
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 px-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-base md:text-lg">
                ابدأ مجاناً
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 md:mb-12 text-center text-2xl md:text-3xl font-bold">مميزات المنصة</h2>
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <Card key={feature.title} className="animate-slide-up border-none shadow-none" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className={`flex flex-col items-center p-5 md:p-6 text-center rounded-xl bg-gradient-to-b ${feature.gradient}`}>
                  <div className="mb-3 md:mb-4 rounded-full bg-background p-3 shadow-sm">
                    <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base md:text-lg font-bold">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-6 md:py-8 text-center text-xs md:text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          © {new Date().getFullYear()} برشامه سمارت - جميع الحقوق محفوظة
        </div>
      </footer>
    </div>
  )
}
