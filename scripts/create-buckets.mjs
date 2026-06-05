import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://guhaegrpfeddgatxwgfm.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aGFlZ3JwZmVkZGdhdHh3Z2ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY0MzI4NSwiZXhwIjoyMDk2MjE5Mjg1fQ.8MG-Y_JdlACVWH3zT39tgRpVt1PJGudE6DwEC_olaiE'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const buckets = [
  { id: 'avatars', name: 'avatars', public: true, file_size_limit: 5242880, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'] },
  { id: 'exam-images', name: 'exam-images', public: true, file_size_limit: 5242880, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'] },
]

async function main() {
  for (const bucket of buckets) {
    const { data: existing } = await supabase.storage.getBucket(bucket.id)
    if (existing) {
      console.log(`∼ Bucket '${bucket.id}' already exists`)
      continue
    }

    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      file_size_limit: bucket.file_size_limit,
      allowed_mime_types: bucket.allowed_mime_types,
    })

    if (error) {
      console.error(`✗ Failed to create '${bucket.id}': ${error.message}`)
    } else {
      console.log(`✓ Created bucket '${bucket.id}'`)
    }
  }

  console.log('\n✅ Buckets setup complete!')
}

main().catch(console.error)
