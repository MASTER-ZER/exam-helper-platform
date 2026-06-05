import type { Metadata } from 'next'
import { Tajawal } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/shared/Navbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800'],
})

export const metadata: Metadata = {
  title: 'برشامه سمارت - منصة تعليمية ذكية',
  description: 'منصة تعليمية تساعد الطلاب على حل الأسئلة والتدريب على الامتحانات باستخدام الذكاء الاصطناعي',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={tajawal.className}>
        <ThemeProvider attribute="class" defaultTheme="gold" enableSystem={false}>
          <TooltipProvider>
            <Navbar />
            <main className="animate-in fade-in duration-300">{children}</main>
            <Toaster richColors position="top-left" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
