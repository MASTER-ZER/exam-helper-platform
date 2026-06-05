'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const months = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 60 }, (_, i) => currentYear - i)

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const parts = value ? value.split('-') : []
  const day = parts[2] || ''
  const month = parts[1] || ''
  const year = parts[0] || ''

  function getDaysInMonth(m: string, y: string): number {
    if (!m || !y) return 31
    return new Date(Number(y), Number(m), 0).getDate()
  }

  function update(part: 'day' | 'month' | 'year', val: string) {
    const d = part === 'day' ? val : day
    const m = part === 'month' ? val : month
    const y = part === 'year' ? val : year

    const maxDay = getDaysInMonth(m, y)
    const finalDay = Math.min(Number(d || '1'), maxDay).toString().padStart(2, '0')
    const finalMonth = m.padStart(2, '0')

    if (d && m && y) {
      onChange(`${y}-${finalMonth}-${finalDay}`)
    }
  }

  const daysInMonth = getDaysInMonth(month, year)

  return (
    <div className="flex gap-2" dir="rtl">
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground">اليوم</span>
        <Select value={day} onValueChange={(v) => update('day', v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0')).map((d) => (
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
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={(i + 1).toString().padStart(2, '0')}>
                {m}
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
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
