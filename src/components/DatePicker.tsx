'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const months = [
  { value: '01', label: 'يناير' },
  { value: '02', label: 'فبراير' },
  { value: '03', label: 'مارس' },
  { value: '04', label: 'أبريل' },
  { value: '05', label: 'مايو' },
  { value: '06', label: 'يونيو' },
  { value: '07', label: 'يوليو' },
  { value: '08', label: 'أغسطس' },
  { value: '09', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' },
  { value: '12', label: 'ديسمبر' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 60 }, (_, i) => String(currentYear - i))

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const parts = value ? value.split('-') : []
  const [day, setDay] = useState(parts[2] || '')
  const [month, setMonth] = useState(parts[1] || '')
  const [year, setYear] = useState(parts[0] || '')

  useEffect(() => {
    const p = value ? value.split('-') : []
    setDay(p[2] || '')
    setMonth(p[1] || '')
    setYear(p[0] || '')
  }, [value])

  const daysInMonth = useMemo(() => {
    if (!month || !year) return 31
    return new Date(Number(year), Number(month), 0).getDate()
  }, [month, year])

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0')),
    [daysInMonth]
  )

  const update = useCallback(
    (part: 'day' | 'month' | 'year', val: string) => {
      const newDay = part === 'day' ? val : day
      const newMonth = part === 'month' ? val : month
      const newYear = part === 'year' ? val : year

      if (part === 'day') setDay(val)
      else if (part === 'month') setMonth(val)
      else if (part === 'year') setYear(val)

      if (!newDay || !newMonth || !newYear) return

      const maxDay = new Date(Number(newYear), Number(newMonth), 0).getDate()
      const finalDay = String(Math.min(Number(newDay), maxDay)).padStart(2, '0')

      onChange(`${newYear}-${newMonth}-${finalDay}`)
    },
    [day, month, year, onChange]
  )

  return (
    <div className="flex gap-2" dir="rtl">
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground">اليوم</span>
        <Select value={day} onValueChange={(v) => update('day', v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground">الشهر</span>
        <Select value={month} onValueChange={(v) => update('month', v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground">السنة</span>
        <Select value={year} onValueChange={(v) => update('year', v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="----" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
