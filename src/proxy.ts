import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check if user has any Supabase auth cookie (logged in)
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-'))
  const { pathname } = request.nextUrl

  const protectedPaths = ['/dashboard', '/chat', '/profile']
  const authPaths = ['/login', '/register']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p))

  // Redirect logged-in users away from landing page
  if (hasSession && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard/chat/profile
  if (!hasSession && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from auth pages
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/chat/:path*', '/profile/:path*', '/login', '/register'],
}
