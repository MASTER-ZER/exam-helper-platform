'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
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
import { LayoutDashboard, MessageCircle, User, LogOut } from 'lucide-react'
import { Logo } from './Logo'

export function Navbar() {
  const { user, profile } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const bottomNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { href: '/chat', icon: MessageCircle, label: 'الشات' },
    { href: '/profile', icon: User, label: 'حسابي' },
  ]

  return (
    <>
      {/* Top Navbar */}
      <nav className="border-b bg-background" dir="rtl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />

          <div className="flex items-center gap-1 md:gap-2">
            <ThemeToggle />
            {user ? (
              <>
                {profile?.role === 'admin' && (
                  <Link href="/admin" className="hidden md:inline-flex">
                    <Button variant="ghost">لوحة التحكم</Button>
                  </Link>
                )}

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

      {/* Mobile Bottom Navigation - hidden on chat pages */}
      {user && !pathname.startsWith('/chat') && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden" dir="rtl">
          <div className="flex h-16 items-center justify-around px-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>خروج</span>
            </button>
          </div>
        </nav>
      )}
    </>
  )
}
