import { Logo } from '@/components/shared/Logo'

export default function MaintenancePage() {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-4 text-center" dir="rtl">
      <Logo size={96} className="mb-6 opacity-60" />
      <h1 className="mb-2 text-2xl font-bold text-muted-foreground">يتم صيانة الموقع</h1>
      <p className="text-muted-foreground/60">
        الموقع قيد الصيانة حاليًا. يرجى المحاولة لاحقًا.
      </p>
    </div>
  )
}
