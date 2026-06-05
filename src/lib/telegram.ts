function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface TelegramUserData {
  full_name: string
  email: string
  phone: string
  governorate: string
  birth_date: string
  plan: string
  user_id: string
  avatar_url?: string
}

interface TelegramExamData {
  full_name: string
  email: string
  phone: string
  governorate: string
  birth_date: string
  upload_time: string
  upload_id: string
  image_url: string
}

interface TelegramAIResponseData {
  full_name: string
  email: string
  phone: string
  image_url?: string
  ai_response: string
  upload_id: string
  user_text?: string
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
  return token
}

function getChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!chatId) throw new Error('TELEGRAM_CHAT_ID is not set')
  return chatId
}

async function sendPhoto(
  photoUrl: string,
  caption: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getBotToken()
    const chatId = getChatId()

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption,
          parse_mode: 'HTML',
        }),
      }
    )
    const data = await res.json()
    return { ok: data.ok, error: data.description }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function sendDocument(
  content: string,
  filename: string,
  caption: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getBotToken()
    const chatId = getChatId()

    const formData = new FormData()
    formData.append('chat_id', chatId)
    formData.append('caption', caption)
    formData.append('parse_mode', 'HTML')
    formData.append('document', new Blob([content], { type: 'text/plain' }), filename)

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return { ok: data.ok, error: data.description }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function sendMessage(message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getBotToken()
    const chatId = getChatId()

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )
    const data = await res.json()
    return { ok: data.ok, error: data.description }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function sendNewUserNotification(
  userData: TelegramUserData
): Promise<{ ok: boolean; error?: string }> {
  const caption = [
    '🆕 <b>طالب جديد سجل في الموقع</b>',
    '',
    `👤 <b>الاسم:</b> ${userData.full_name}`,
    `📧 <b>الإيميل:</b> ${userData.email}`,
    `📞 <b>رقم الهاتف:</b> ${userData.phone}`,
    `📍 <b>المحافظة:</b> ${userData.governorate}`,
    `🎂 <b>تاريخ الميلاد:</b> ${userData.birth_date}`,
    `📋 <b>الخطة:</b> ${userData.plan}`,
    `🆔 <b>User ID:</b> ${userData.user_id}`,
    `🕐 <b>وقت التسجيل:</b> ${new Date().toLocaleString('ar-EG')}`,
  ].join('\n')

  if (userData.avatar_url) {
    return sendPhoto(userData.avatar_url, caption)
  }
  return sendMessage(caption)
}

export async function sendExamUploadNotification(
  examData: TelegramExamData
): Promise<{ ok: boolean; error?: string }> {
  const caption = [
    '📸 <b>رفع صورة سؤال/امتحان جديد</b>',
    '',
    `👤 <b>الاسم:</b> ${examData.full_name}`,
    `📧 <b>الإيميل:</b> ${examData.email}`,
    `📞 <b>رقم الهاتف:</b> ${examData.phone}`,
    `📍 <b>المحافظة:</b> ${examData.governorate}`,
    `🎂 <b>تاريخ الميلاد:</b> ${examData.birth_date}`,
    `🕐 <b>وقت الرفع:</b> ${examData.upload_time}`,
    `🆔 <b>Exam Upload ID:</b> ${examData.upload_id}`,
  ].join('\n')

  return sendPhoto(examData.image_url, caption)
}

const TELEGRAM_MAX_LENGTH = 4096

function splitMessage(text: string): string[] {
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= TELEGRAM_MAX_LENGTH) {
      chunks.push(remaining)
      break
    }
    let splitAt = remaining.lastIndexOf('\n', TELEGRAM_MAX_LENGTH)
    if (splitAt === -1 || splitAt < TELEGRAM_MAX_LENGTH / 2) {
      splitAt = TELEGRAM_MAX_LENGTH
    }
    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt).trim()
  }
  return chunks
}

export async function sendAIResponseNotification(
  data: TelegramAIResponseData
): Promise<{ ok: boolean; error?: string }> {
  const lines = [
    '✅ <b>تم حل السؤال</b>',
    '',
    `👤 <b>الاسم:</b> ${escapeHtml(data.full_name)}`,
    `📧 <b>الإيميل:</b> ${escapeHtml(data.email)}`,
    `📞 <b>رقم الهاتف:</b> ${escapeHtml(data.phone)}`,
    `🆔 <b>ID:</b> ${escapeHtml(data.upload_id)}`,
  ]
  if (data.user_text) {
    lines.push(`💬 <b>السؤال:</b> ${escapeHtml(data.user_text)}`)
  }
  if (data.image_url) {
    lines.push(`🖼️ <b>مع صورة</b>`)
  }
  lines.push('', '━━━━━━━━━━━━━━━━', '')

  const header = lines.join('\n')

  const escapedResponse = escapeHtml(data.ai_response || '')
  const fullMessage = header + escapedResponse
  const chunks = splitMessage(fullMessage)

  for (const chunk of chunks) {
    const result = await sendMessage(chunk)
    if (!result.ok) return result
  }

  return { ok: true }
}

export async function testTelegramConnection(): Promise<{
  ok: boolean
  error?: string
}> {
  try {
    const token = getBotToken()
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const data = await res.json()
    return { ok: data.ok, error: data.description }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
