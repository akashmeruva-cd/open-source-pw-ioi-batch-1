import { HttpError } from '@repo/http/http-error'
import { eq, getDb, getSupabaseAdmin } from '@repo/models/db'
import { profiles } from '@repo/models/schema'
import type { LoginInput, PublicUser } from '@repo/validation/auth'
import { ADMIN_PORTAL_ROLES } from '@repo/validation/enums'
import type { Role } from '@repo/validation/enums'

/**
 * Owner: Team 03 — Auth & Identity.
 *
 * Deliberately smaller than the student one: there is **no self-registration**
 * here. Admin and faculty accounts are created by an existing admin through
 * Team 11's user-management screens, so there is no public path to a privileged
 * account.
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

function assertCanUseAdminPortal(profile: typeof profiles.$inferSelect) {
  if (!ADMIN_PORTAL_ROLES.includes(profile.role as Role)) {
    // Same message as a bad password: a student probing this endpoint should not
    // learn that their credentials were correct but their role was not.
    throw HttpError.unauthorized('Email or password is incorrect')
  }
}

export async function loginAdmin(input: LoginInput) {
  const db = getDb()
  const supabase = getSupabaseAdmin()

  const invalid = HttpError.unauthorized('Email or password is incorrect')

  const { data: session, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error || !session.session) throw invalid

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1)

  if (!profile || !profile.isActive) throw invalid
  assertCanUseAdminPortal(profile)

  return {
    user: toPublicUser(profile),
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
  }
}

export async function refreshAdminSession(refreshToken: string) {
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
  // Re-checked on every refresh: an admin demoted to STUDENT loses the portal at
  // the next rotation rather than at the end of their refresh window.
  assertCanUseAdminPortal(profile)

  return {
    user: toPublicUser(profile),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}

export async function endAdminSession(accessToken: string) {
  const supabase = getSupabaseAdmin()
  await supabase.auth.admin.signOut(accessToken)
}

export async function getAdminById(id: string) {
  const db = getDb()
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1)

  if (!profile || !profile.isActive) throw HttpError.notFound('User not found')
  return toPublicUser(profile)
}
