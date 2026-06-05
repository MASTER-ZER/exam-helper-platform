'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Diamond } from 'lucide-react'

const themes = ['light', 'dark', 'gold'] as const
const icons = [Sun, Moon, Diamond]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-10 w-10" />

  const currentIndex = themes.indexOf((theme as typeof themes[number]) || 'light')
  const nextIndex = (currentIndex + 1) % themes.length
  const Icon = icons[currentIndex]

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(themes[nextIndex])}
      className="h-10 w-10 rounded-full"
    >
      <Icon className="h-5 w-5" />
    </Button>
  )
}
