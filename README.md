# برشامه سمارت (Brshama Smart) - Exam Helper Platform

منصة تعليمية ذكية تساعد الطلاب على حل الأسئلة والتدرب على الامتحانات باستخدام الذكاء الاصطناعي.

## التقنيات المستخدمة

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI-compatible API (gemini-3.5-flash via api.bluesminds.com)
- **Notifications**: Telegram Bot
- **Deployment**: Vercel

## المتطلبات

- Node.js 20.9+
- npm
- حساب Supabase (مجاني)
- مفتاح Google Gemini API
- توكن Telegram Bot

## البدء السريع

### 1. إنشاء مشروع Supabase

1. أنشئ حساب على [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. اذهب إلى **SQL Editor** وشغّل ملف `supabase/schema.sql`
4. اذهب إلى **SQL Editor** وشغّل ملف `supabase/policies.sql`

### 2. إنشاء Storage Buckets

1. اذهب إلى **Storage** في Supabase
2. أنشئ bucket بإسم `avatars` (public)
3. أنشئ bucket بإسم `exam-images` (public)

### 3. إعداد Telegram Bot

1. افتح [@BotFather](https://t.me/botfather) على تليجرام
2. أرسل `/newbot` واتبع التعليمات
3. احصل على التوكن (مثال: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. أنشئ مجموعة جديدة وأضف البوت كمشرف
5. أرسل أي رسالة في المجموعة
6. افتح الرابط: `https://api.telegram.org/bot<TOKEN>/getUpdates`
7. خذ `chat_id` من الاستجابة

### 4. إعداد AI API

1. احصل على API Key من مزود الخدمة (مثل `https://api.bluesminds.com/v1`)
2. استخدم الموديل المناسب (مثل `gemini-3.5-flash`)
3. أضف المفتاح إلى ملف `.env`

### 5. تشغيل المشروع محلياً

```bash
# استنساخ المشروع
git clone https://github.com/yourusername/exam-helper-platform.git
cd exam-helper-platform

# تثبيت الاعتماديات
npm install

# نسخ ملف المتغيرات البيئية
cp .env.example .env

# تعديل ملف .env وأضف المتغيرات الخاصة بك
# ثم شغّل المشروع
npm run dev
```

### 6. النشر على Vercel

```bash
# أنشئ حساب على Vercel
# اربط المستودع
# أضف المتغيرات البيئية كلها في Vercel Dashboard
# انشر
```

## متغيرات البيئة

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI API (OpenAI-compatible)
AI_API_KEY=your-api-key
AI_API_URL=https://api.bluesminds.com/v1
AI_MODEL=gemini-3.5-flash

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Admin
ADMIN_EMAILS=admin@example.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## SQL Schema

راجع `supabase/schema.sql` لكل الجداول (6 جداول):

- `profiles` - بيانات المستخدمين
- `exam_conversations` - جلسات المحادثة
- `exam_uploads` - رفع الامتحانات
- `plans` - خطط الاشتراك
- `admin_logs` - سجل نشاط الأدمن
- `telegram_logs` - سجل التليجرام

## RLS Policies

راجع `supabase/policies.sql` لسياسات Row Level Security الكاملة.

## هيكل المشروع

```
src/
├── app/
│   ├── admin/           # لوحة التحكم (6 أقسام)
│   ├── api/             # API Routes (18 مسار)
│   ├── dashboard/       # لوحة الطالب
│   ├── login/           # تسجيل الدخول
│   ├── register/        # إنشاء حساب
│   ├── profile/         # الملف الشخصي
│   ├── pricing/         # الباقات
│   ├── page.tsx         # الصفحة الرئيسية
│   └── proxy.ts         # Middleware للحماية
├── components/
│   ├── admin/           # مكونات الأدمن
│   ├── dashboard/       # مكونات لوحة الطالب
│   ├── forms/           # نماذج
│   ├── landing/         # مكونات الصفحة الرئيسية
│   ├── shared/          # مكونات مشتركة
│   └── ui/              # مكونات shadcn/ui
├── hooks/               # React Hooks
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── gemini.ts        # Google Gemini API
│   ├── telegram.ts      # Telegram Bot API
│   └── utils.ts         # دوال مساعدة
└── types/               # TypeScript types
```

## جعل مستخدم Admin

هناك طريقتان:

### الطريقة الأولى: SQL مباشر

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### الطريقة الثانية: Admin Emails

أضف البريد الإلكتروني إلى `ADMIN_EMAILS` في ملف `.env`:

```env
ADMIN_EMAILS=admin@example.com,another@example.com
```

## مسارات API

### Auth
- `POST /api/auth/register-profile` - تسجيل مستخدم جديد

### Telegram
- `POST /api/telegram/new-user` - إرسال إشعار تسجيل مستخدم جديد
- `POST /api/telegram/exam-upload` - إرسال إشعار رفع امتحان

### Exam
- `POST /api/exam/upload` - رفع صورة سؤال وتحليلها

### Admin
- `GET /api/admin/students` - قائمة الطلاب (مع بحث وفلاتر)
- `GET /api/admin/students/[id]` - بيانات طالب
- `GET /api/admin/students/[id]/conversations` - محادثات طالب
- `GET /api/admin/conversations` - كل المحادثات
- `GET /api/admin/conversations/[id]` - تفاصيل محادثة
- `DELETE /api/admin/conversations/[id]` - حذف محادثة
- `GET /api/admin/telegram-logs` - سجل التليجرام
- `PATCH /api/admin/users/[id]/plan` - تغيير خطة الطالب
- `PATCH /api/admin/users/[id]/ban` - حظر/إلغاء حظر الطالب
- `POST /api/admin/test-telegram` - اختبار اتصال التليجرام
- `POST /api/admin/test-ai` - اختبار اتصال AI

## الترخيص

هذا المشروع مفتوح المصدر. يمكنك استخدامه وتعديله بحرية.

## تنبيه هام

هذه المنصة مخصصة للتعلم والمراجعة فقط. نحن نلتزم بسياسات النزاهة الأكاديمية ولا نشجع على استخدام المنصة للغش أثناء الامتحانات المباشرة.
