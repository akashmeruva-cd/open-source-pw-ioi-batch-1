import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as schema from './schema'

/**
 * LOCKED FILE — Team 01 (Core Platform).
 *
 * Replaces the old Mongoose connection caching with Drizzle ORM + Supabase.
 * Two clients are exported:
 *
 *   `db`       — Drizzle ORM instance for all data queries.
 *   `supabase` — Supabase client for auth operations (sign-up, sign-in, etc.).
 *
 * Both are cached so warm serverless invocations reuse the same connection.
 */

type DbCache = {
  db: ReturnType<typeof drizzle> | null
  sql: ReturnType<typeof postgres> | null
  supabase: SupabaseClient | null
}

declare global {
  // eslint-disable-next-line no-var
  var __dbCache: DbCache | undefined
}

const cache: DbCache = globalThis.__dbCache ?? { db: null, sql: null, supabase: null }
globalThis.__dbCache = cache

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`)
  }
  return value
}

/**
 * Returns a cached Drizzle ORM instance connected to Supabase PostgreSQL.
 * Call at the top of every request handler — it is cheap once warm.
 */
export function getDb() {
  if (cache.db) return cache.db

  const databaseUrl = requireEnv('DATABASE_URL')

  cache.sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  cache.db = drizzle(cache.sql, { schema })

  return cache.db
}

/** Returns a cached Supabase Admin client (service role) for auth operations. */
export function getSupabaseAdmin(): SupabaseClient {
  if (cache.supabase) return cache.supabase

  const url = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  cache.supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return cache.supabase
}

/** Returns a Supabase client scoped to the anon key (for frontend-facing use). */
export function getSupabaseClient(): SupabaseClient {
  const url = requireEnv('SUPABASE_URL')
  const anonKey = requireEnv('SUPABASE_ANON_KEY')

  return createClient(url, anonKey)
}

/** Used by tests and scripts that need a clean shutdown. */
export async function disconnectFromDatabase() {
  if (cache.sql) {
    await cache.sql.end()
    cache.sql = null
    cache.db = null
  }
  cache.supabase = null
}

export { schema }
export { eq, and, or, sql, desc, asc, not, inArray, notInArray } from 'drizzle-orm'
export type Database = ReturnType<typeof getDb>
