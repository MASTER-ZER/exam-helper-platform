'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch('/api/maintenance/status')
        const data = await res.json()
        if (cancelled) return
        if (data.maintenance && !data.admin && pathname !== '/maintenance' && pathname !== '/login' && pathname !== '/register') {
          router.replace('/maintenance')
        }
      } catch {}
      if (!cancelled) setReady(true)
    }
    check()
    return () => { cancelled = true }
  }, [pathname, router])

  if (!ready && pathname !== '/maintenance') return null

  return <>{children}</>
}
