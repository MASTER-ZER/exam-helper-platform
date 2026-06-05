import { NextResponse } from 'next/server'
import { testVisionConnection } from '@/lib/groq'

export async function POST() {
  try {
    const result = await testVisionConnection()
    if (result.ok) {
      return NextResponse.json({ success: true, message: 'Vision API متصل' })
    }
    return NextResponse.json({ success: false, error: result.error || 'فشل الاتصال' })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'فشل الاتصال' })
  }
}
