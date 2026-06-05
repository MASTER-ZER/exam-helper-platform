import { NextResponse } from 'next/server'
import { testAIConnection } from '@/lib/gemini'

export async function POST() {
  try {
    const result = await testAIConnection()
    if (result.ok) {
      return NextResponse.json({ success: true, message: 'تم الاتصال بنجاح' })
    }
    return NextResponse.json({ success: false, error: result.error || 'فشل الاتصال' })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'فشل الاتصال' })
  }
}
