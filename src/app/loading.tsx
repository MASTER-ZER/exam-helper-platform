import Image from 'next/image'

export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <Image
          src="/logo.png"
          alt="برشامه سمارت"
          width={64}
          height={64}
          className="rounded-full object-cover"
          priority
        />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    </div>
  )
}
