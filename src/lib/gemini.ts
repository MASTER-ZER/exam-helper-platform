import { extractTextFromImage } from './groq'
import { CORRECTOR_PROMPT } from './prompts'

const SYSTEM_INSTRUCTION = `أنت "البروفيسور أينشتاين" — نموذج ذكاء اصطناعي متخصص حصرياً في حل امتحانات الصف الثالث الإعدادي المصري، الترم الثاني، وفق منهج وزارة التربية والتعليم المصرية.

═══════════════════════════════════════════
الشخصية والدور
═══════════════════════════════════════════

أنت لستَ مجرد نموذج يجيب على أسئلة.
أنت كبير مصححي الوزارة + أفضل مدرس خصوصي في مصر مجتمعَين في نموذج واحد.
تفكيرك يبدأ من زاوية المصحح: ماذا يريد أن يرى؟ ما الكلمات التي تعطي الدرجة الكاملة؟

═══════════════════════════════════════════
القاعدة الأولى والأهم — استخراج الأسئلة
═══════════════════════════════════════════

عند استلام أي نص، يجب أن تنفذ الآتي بترتيب صارم لا استثناء فيه:

الخطوة 1 — قراءة شاملة للنص بالكامل
اقرأ كل الكلمات. لا تبدأ الحل قبل أن تنهي قراءة كل الأسئلة.

الخطوة 2 — فهرسة الأسئلة قبل الحل
قبل الحل، اعرض فهرساً مختصراً:
▸ السؤال 1 — [نوعه]
▸ السؤال 2 — [نوعه]
ثم ابدأ الحل فوراً دون انتظار.

═══════════════════════════════════════════
قالب الحل — مُلزم لكل سؤال بدون استثناء
═══════════════════════════════════════════

لكل سؤال، استخدم هذا القالب حرفياً:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 السؤال [رقمه]:
[نص السؤال كاملاً]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ الإجابة النموذجية:
[الإجابة الكاملة — لا اختصار — كما يُفترض أن يكتبها الطالب]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 التعليل:
[شرح كامل: لماذا هذه الإجابة صحيحية؟ على أي قانون أو قاعدة تستند؟]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

القيود الصارمة على هذا القالب:
• السؤال يُكتب أولاً دائماً.
• الإجابة النموذجية تأتي ثانياً، كاملة غير منقوصة.
• التعليل يأتي ثالثاً، وافياً لا مبتوراً.
• يُحظر تماماً: مقدمات / نصائح / أسئلة للمستخدم.

═══════════════════════════════════════════
بروتوكول نهاية الجلسة
═══════════════════════════════════════════

عندما يكتب المستخدم: "خلصت" أو "إتمام" أو "اتمام":
1. أعلن إغلاق استقبال الأسئلة.
2. اجمع كل الأسئلة والإجابات في مستند واحد منظم.
3. أزل كل الشروحات — أبقِ فقط: نص السؤال + الإجابة النهائية.

═══════════════════════════════════════════
القواعد المطلقة
═══════════════════════════════════════════

01. لا تبدأ الحل قبل قراءة جميع الأسئلة.
02. لا تغير حرفاً واحداً في نص السؤال.
03. لا تتجاهل أي سؤال أو بند مهما كان صغيراً.
04. لا تُدرج محتوى خارج القالب الثلاثي (سؤال — إجابة — تعليل).
05. لا تختصر الإجابة النموذجية.
06. لا تسأل المستخدم "أي سؤال تريد؟" — حل الكل فوراً.
07. لا تكتب مقدمات أو تحيات.
08. الإجابة النموذجية تُكتب كما يكتبها طالب يريد الدرجة الكاملة.
09. التعليل لا يكون أقل من سطرين.`

interface AIResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callAI(messages: ChatMessage[]): Promise<{
  success: boolean
  text?: string
  error?: string
}> {
  try {
    const apiKey = process.env.AI_API_KEY
    const apiUrl = process.env.AI_API_URL || 'https://api.bluesminds.com/v1'
    const model = process.env.AI_MODEL || 'gemini-3.5-flash'

    if (!apiKey) {
      return { success: false, error: 'AI_API_KEY is not configured' }
    }

    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 8192,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      return { success: false, error: `AI API error (${res.status}): ${errorText}` }
    }

    const data: AIResponse = await res.json()

    if (!data.choices || data.choices.length === 0) {
      return { success: false, error: 'لم يتم الحصول على رد من الذكاء الاصطناعي' }
    }

    return { success: true, text: data.choices[0].message.content }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during AI processing',
    }
  }
}

export async function chatWithAI(
  history: { role: 'user' | 'assistant'; content: string }[],
  text?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  let userMessage = text || 'تابع حل الأسئلة.'

  // If image is provided, extract text via Qwen OCR first
  if (imageBase64 && mimeType) {
    const ocrResult = await extractTextFromImage(imageBase64, mimeType)
    if (ocrResult.success && ocrResult.text && ocrResult.text.trim().length >= 10) {
      userMessage = `حل الأسئلة التالية باتباع التعليمات بدقة:\n\n${ocrResult.text}`
    } else if (text) {
      userMessage = text
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.slice(-20).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const result = await callAI(messages)
  if (result.success && result.text) {
    result.text = result.text.replace(/^```(?:json)?\s*|```$/g, '').trim()
  }
  return result
}

export async function solveImageWithAI(
  imageBase64: string,
  mimeType: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  const ocrResult = await extractTextFromImage(imageBase64, mimeType)

  if (!ocrResult.success) {
    return { success: false, error: `فشل استخراج النص من الصورة: ${ocrResult.error}` }
  }

  if (!ocrResult.text || ocrResult.text.trim().length < 10) {
    return { success: false, error: 'لم يتم العثور على نص كافٍ في الصورة. يرجى رفع صورة أوضح.' }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    { role: 'user', content: `حل الأسئلة التالية باتباع التعليمات بدقة:\n\n${ocrResult.text}` },
  ]

  return callAI(messages)
}

export async function correctImageWithAI(
  imageBase64: string,
  mimeType: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  const ocrResult = await extractTextFromImage(imageBase64, mimeType)

  if (!ocrResult.success) {
    return { success: false, error: `فشل استخراج النص من الصورة: ${ocrResult.error}` }
  }

  if (!ocrResult.text || ocrResult.text.trim().length < 10) {
    return { success: false, error: 'لم يتم العثور على نص كافٍ في الصورة. يرجى رفع صورة أوضح.' }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: CORRECTOR_PROMPT },
    { role: 'user', content: `صحيح الأسئلة التالية:\n\n${ocrResult.text}` },
  ]

  return callAI(messages)
}

export async function testAIConnection(): Promise<{
  ok: boolean
  error?: string
}> {
  try {
    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return { ok: false, error: 'AI_API_KEY is not configured' }
    }

    const apiUrl = process.env.AI_API_URL || 'https://api.bluesminds.com/v1'
    const model = process.env.AI_MODEL || 'gemini-3.5-flash'

    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Just reply with "OK" if you are working.' }],
        max_tokens: 10,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      return { ok: false, error: `API error (${res.status}): ${errorText}` }
    }

    return { ok: true }
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
