const VISION_MODEL = 'gpt-4o'

const EXTRACTION_PROMPT = `أنت متخصص في استخراج النصوص العربية من صور الامتحانات بدقة فائقة.
مهمتك: استخرج كل النص الموجود في الصورة بدقة كاملة.

قواعد صارمة:
- انسخ النص كما هو بدون تعديل أو إعادة صياغة
- حافظ على ترقيم الأسئلة والفقرات كما هي
- إذا كانت كلمة غير مقروءة اكتب [غير واضح] في مكانها
- لا تختصر أي شيء
- أخرج النص فقط بدون أي مقدمات أو تعليقات أو تحليلات
- لا تكتب "النص المستخرج:" أو ما شابه
- حافظ على تنسيق الأسطر والفقرات`

export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return { success: false, error: 'AI_API_KEY is not configured' }
    }

    const apiUrl = process.env.AI_API_URL || 'https://api.bluesminds.com/v1'

    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        stream: false,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 8192,
        temperature: 0.1,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      return { success: false, error: `Vision API error (${res.status}): ${errorText}` }
    }

    const data = await res.json()

    if (!data.choices || data.choices.length === 0) {
      return { success: false, error: 'لم يتم الحصول على رد' }
    }

    const text = data.choices[0].message.content
    if (!text || text.trim().length < 5) {
      return { success: false, error: 'لم يتم العثور على نص كافٍ في الصورة' }
    }

    return { success: true, text }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during vision processing',
    }
  }
}

export async function testVisionConnection(): Promise<{
  ok: boolean
  error?: string
}> {
  try {
    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return { ok: false, error: 'AI_API_KEY is not configured' }
    }

    const apiUrl = process.env.AI_API_URL || 'https://api.bluesminds.com/v1'

    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        stream: false,
        messages: [{ role: 'user', content: 'Reply with just: OK' }],
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
