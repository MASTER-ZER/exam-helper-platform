'use client'

import { useState, useMemo, useEffect } from 'react'

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

  function handleChange(part: 'day' | 'month' | 'year', val: string) {
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
  }

  return (
    <div className="flex gap-2" dir="rtl">
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground">اليوم</span>
        <select
          value={day}
          onChange={(e) => handleChange('day', e.target.value)}
          className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">--</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground">الشهر</span>
        <select
          value={month}
          onChange={(e) => handleChange('month', e.target.value)}
          className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">--</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground">السنة</span>
        <select
          value={year}
          onChange={(e) => handleChange('year', e.target.value)}
          className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">----</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
