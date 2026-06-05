import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://guhaegrpfeddgatxwgfm.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aGFlZ3JwZmVkZGdhdHh3Z2ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY0MzI4NSwiZXhwIjoyMDk2MjE5Mjg1fQ.8MG-Y_JdlACVWH3zT39tgRpVt1PJGudE6DwEC_olaiE'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = 'eyadmuhammed2011@gmail.com'
const password = 'Eyad159357@#'

async function main() {
  // Try creating the user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin' },
  })

  if (authError) {
    // User might already exist - try to find by listing users
    if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
      console.log('∼ User already exists in Auth')
      
      // Fetch all users to find the ID
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users.find(u => u.email === email)
      
      if (existingUser) {
        console.log(`∼ Found existing user: ${existingUser.id}`)
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', existingUser.id)
          .single()
        
        if (existingProfile) {
          // Update role
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', existingUser.id)
          console.log('✓ Updated existing profile to admin')
        } else {
          // Create profile
          await supabase.from('profiles').insert({
            id: existingUser.id,
            full_name: 'Admin',
            email,
            phone: '01000000000',
            governorate: 'القاهرة',
            birth_date: '2000-01-01',
            avatar_url: '',
            plan: 'paid',
            role: 'admin',
          })
          console.log('✓ Created admin profile')
        }
        
        console.log('\n✅ Admin ready!')
        console.log(`   Email: ${email}`)
      } else {
        console.error('✗ Could not find existing user')
        process.exit(1)
      }
    } else {
      console.error('✗ Failed:', authError.message)
      process.exit(1)
    }
    return
  }

  // New user created
  const userId = authData.user.id
  console.log(`✓ Auth user created: ${userId}`)

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    full_name: 'Admin',
    email,
    phone: '01000000000',
    governorate: 'القاهرة',
    birth_date: '2000-01-01',
    avatar_url: '',
    plan: 'paid',
    role: 'admin',
  })

  if (profileError) {
    console.error('✗ Profile error:', profileError.message)
    process.exit(1)
  }

  console.log('✓ Admin profile created')
  console.log('\n✅ Admin user ready!')
  console.log(`   Email: ${email}`)
}

main().catch(console.error)
