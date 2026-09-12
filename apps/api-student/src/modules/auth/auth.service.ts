import { HttpError } from '@repo/http/http-error'
import { eq, getDb, getSupabaseAdmin } from '@repo/models/db'
import { profiles } from '@repo/models/schema'
import type { LoginInput, PublicUser, RegisterInput } from '@repo/validation/auth'
import type { Role } from '@repo/validation/enums'

/**
 * Owner: Team 03 — Auth & Identity.
 *
 * This module is the reference vertical: every other feature module in this repo
 * should look like it — routes → controller → service, with the service holding
 * all the logic and never touching `req`/`res`.
 *
 * Auth operations now delegate to Supabase Auth. The `profiles` table in our
 * public schema stores app-specific fields (role, batchId, avatarUrl).
 */

function toPublicUser(row: typeof profiles.$inferSelect): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    batchId: row.batchId,
    avatarUrl: row.avatarUrl,
  }
}

export async function registerUser(input: RegisterInput) {
  const db = getDb()
  const supabase = getSupabaseAdmin()

  // Check for existing profile first
  const existing = await db.select().from(profiles).where(eq(profiles.email, input.email)).limit(1)
  if (existing.length > 0) {
    throw HttpError.conflict('An account with this email already exists')
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: { role: 'STUDENT', batch_id: null },
  })

  if (authError || !authData.user) {
    throw new HttpError(500, 'INTERNAL_ERROR', authError?.message ?? 'Failed to create user')
  }

  // Create profile in our public schema
  const [profile] = await db
    .insert(profiles)
    .values({
      id: authData.user.id,
      name: input.name,
      email: input.email,
      role: 'STUDENT',
    })
    .returning()

  if (!profile) throw new HttpError(500, 'INTERNAL_ERROR', 'Failed to create profile')

  // Sign in to get tokens
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (signInError || !session.session) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Account created but sign-in failed')
  }

  return {
    user: toPublicUser(profile),
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
  }
}

export async function loginUser(input: LoginInput) {
  const db = getDb()
  const supabase = getSupabaseAdmin()

  // Same error for "no such user" and "wrong password"
  const invalid = HttpError.unauthorized('Email or password is incorrect')

  const { data: session, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error || !session.session) throw invalid

  // Look up profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1)

  if (!profile || !profile.isActive) throw invalid

  return {
    user: toPublicUser(profile),
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
  }
}

export async function refreshSession(refreshToken: string) {
  const db = getDb()
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

  if (error || !data.session || !data.user) {
    throw HttpError.unauthorized('Session expired, please sign in again')
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1)

  if (!profile || !profile.isActive) {
    throw HttpError.unauthorized('Session expired, please sign in again')
  }

  return {
    user: toPublicUser(profile),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}

export async function endSession(accessToken: string) {
  const supabase = getSupabaseAdmin()
  // Supabase admin can sign out a user by their JWT
  await supabase.auth.admin.signOut(accessToken)
}

export async function getUserById(id: string) {
  const db = getDb()
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1)

  if (!profile || !profile.isActive) throw HttpError.notFound('User not found')
  return toPublicUser(profile)
}
