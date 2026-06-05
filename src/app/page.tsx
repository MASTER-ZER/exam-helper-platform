'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, Brain, MessageCircle } from 'lucide-react'

const features = [
  {
    icon: Upload,
    title: 'رفع الصور',
    desc: 'ارفع صور الأسئلة والامتحانات بسهولة بصيغ JPG, PNG, WebP',
  },
  {
    icon: Brain,
    title: 'ذكاء اصطناعي متقدم',
    desc: 'تحليل الصور وحل الأسئلة خطوة بخطوة باستخدام Google Gemini',
  },
  {
    icon: MessageCircle,
    title: 'شرح تفصيلي',
    desc: 'شرح وافي لكل سؤال مع خطوات الحل والإجابة النهائية',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" dir="rtl">
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-6xl">
            برشامه سمارت
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            منصة تعليمية ذكية تساعدك على حل الأسئلة والتدرب على الامتحانات
            باستخدام أحدث تقنيات الذكاء الاصطناعي
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                ابدأ مجاناً
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">مميزات المنصة</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <feature.icon className="mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          © {new Date().getFullYear()} برشامه سمارت - جميع الحقوق محفوظة
        </div>
      </footer>
    </div>
  )
}
