import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Simple .env parser
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      process.env[key] = val
    }
  }
}

import { getDb, getSupabaseAdmin, sql } from '@repo/models/db'

async function check() {
  console.log('--- Checking Supabase Configuration ---\n')

  const dbUrl = process.env.DATABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const jwtSecret = process.env.SUPABASE_JWT_SECRET

  // 1. Check environment variables
  console.log('1. Checking Environment Variables in .env:')
  console.log('  - DATABASE_URL:           ', dbUrl ? '✅ Set' : '❌ Missing')
  console.log(
    '  - SUPABASE_URL:           ',
    supabaseUrl ? `✅ Set (${supabaseUrl})` : '❌ Missing',
  )
  console.log(
    '  - SUPABASE_ANON_KEY:      ',
    anonKey ? `✅ Set (${anonKey.slice(0, 15)}...)` : '❌ Missing',
  )
  console.log(
    '  - SUPABASE_SERVICE_ROLE_KEY: ',
    serviceRoleKey ? `✅ Set (${serviceRoleKey.slice(0, 15)}...)` : '❌ Missing',
  )
  console.log(
    '  - SUPABASE_JWT_SECRET:    ',
    jwtSecret ? `✅ Set (${jwtSecret.slice(0, 8)}...)` : '❌ Missing',
  )

  if (!dbUrl || !supabaseUrl || !serviceRoleKey) {
    console.error('\n❌ Critical variables are missing. Please verify your .env file.')
    process.exit(1)
  }

  // 2. Test PostgreSQL Database connection
  console.log('\n2. Testing PostgreSQL Database connection (DATABASE_URL)...')
  try {
    const db = getDb()
    const result: any = await db.execute(sql`SELECT version(), current_database(), current_user;`)
    console.log('  ✅ PostgreSQL connected successfully!')
    console.log('     Database Name:', result[0]?.current_database)
    console.log('     User:         ', result[0]?.current_user)
    console.log(
      '     Version:      ',
      (result[0]?.version as string)?.split(' ').slice(0, 2).join(' '),
    )
  } catch (err: any) {
    console.error('  ❌ PostgreSQL connection failed:', err.message)
  }

  // 3. Test Supabase Auth & Admin API
  console.log('\n3. Testing Supabase Auth Admin API (SUPABASE_URL + SERVICE_ROLE_KEY)...')
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      console.error('  ❌ Supabase Auth API returned error:', error.message)
    } else {
      console.log('  ✅ Supabase Auth API connected successfully!')
      console.log('     Total users in auth database:', data.total ?? data.users.length)
    }
  } catch (err: any) {
    console.error('  ❌ Supabase Auth connection failed:', err.message)
  }

  // 4. Test Supabase Storage
  console.log('\n4. Testing Supabase Storage...')
  try {
    const supabase = getSupabaseAdmin()
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('  ❌ Supabase Storage error:', error.message)
    } else {
      console.log('  ✅ Supabase Storage API connected successfully!')
      console.log('     Existing buckets:', buckets.map((b) => b.name).join(', ') || '(none yet)')
      const uploadsBucket = buckets.find((b) => b.name === 'uploads')
      if (uploadsBucket) {
        console.log('     Bucket "uploads": ✅ Found (Public bucket: ' + uploadsBucket.public + ')')
      } else {
        console.log(
          '     Bucket "uploads": ⚠️ Bucket "uploads" not created yet. Please create a public bucket named "uploads" in Supabase Dashboard → Storage.',
        )
      }
    }
  } catch (err: any) {
    console.error('  ❌ Supabase Storage failed:', err.message)
  }

  console.log('\n--- All Checks Complete ---')
  process.exit(0)
}

check().catch((err) => {
  console.error(err)
  process.exit(1)
})
