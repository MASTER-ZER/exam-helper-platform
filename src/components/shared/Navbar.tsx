'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Navbar() {
  const { user, profile } = useUser()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b bg-background" dir="rtl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          برشامه سمارت
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/chat" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm">الشات</Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost">لوحة التحكم</Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="ghost">لوحة الطالب</Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/chat')} className="md:hidden">
                    الشات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">تسجيل الدخول</Button>
              </Link>
              <Link href="/register">
                <Button>إنشاء حساب</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
