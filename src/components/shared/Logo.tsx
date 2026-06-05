import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  showText?: boolean
  className?: string
  size?: number
}

export function Logo({ showText = true, className = '', size = 40 }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="برشامه سمارت"
        width={size}
        height={size}
        className="rounded-full object-cover"
        priority
      />
      {showText && (
        <span className="text-xl font-bold">برشامه سمارت</span>
      )}
    </Link>
  )
}
