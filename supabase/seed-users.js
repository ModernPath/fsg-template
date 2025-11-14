#!/usr/bin/env node

/**
 * Supabase Seed Users Script
 * 
 * Luo testikäyttäjät Supabase Auth:n kautta oikeilla salasanoilla
 * HUOM: Tämä skripti on tarkoitettu vain paikalliseen kehitykseen!
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Luo Admin-client jolla voi luoda käyttäjiä
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@test.com',
    password: 'test123',
    role: 'admin',
    username: 'admin',
    full_name: 'Admin User',
    is_admin: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'broker@test.com',
    password: 'test123',
    role: 'broker',
    username: 'broker',
    full_name: 'Broker User',
    is_admin: false
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'seller@test.com',
    password: 'test123',
    role: 'seller',
    username: 'seller',
    full_name: 'Seller User',
    is_admin: false
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'buyer@test.com',
    password: 'test123',
    role: 'buyer',
    username: 'buyer',
    full_name: 'Buyer User',
    is_admin: false
  }
]

async function seedUsers() {
  console.log('🌱 Aloitetaan testikäyttäjien luonti...\n')

  for (const user of testUsers) {
    console.log(`📝 Luodaan käyttäjä: ${user.email}`)

    try {
      // 1. Luo käyttäjä Auth:n kautta (tämä luo oikean salasana-hashin)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          full_name: user.full_name
        }
      })

      if (authError) {
        console.error(`   ❌ Auth virhe: ${authError.message}`)
        continue
      }

      console.log(`   ✅ Auth-käyttäjä luotu: ${authData.user.id}`)

      // 2. Luo profiili
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          is_admin: user.is_admin,
          onboarding_completed: false
        })

      if (profileError) {
        console.error(`   ❌ Profiili virhe: ${profileError.message}`)
      } else {
        console.log(`   ✅ Profiili luotu`)
      }

      console.log('')

    } catch (error) {
      console.error(`   ❌ Odottamaton virhe: ${error.message}\n`)
    }
  }

  console.log('✨ Valmis!\n')
  console.log('🔐 Testikäyttäjät:')
  testUsers.forEach(user => {
    console.log(`   ${user.email} / ${user.password} (${user.role})`)
  })
}

// Suorita
seedUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

