import { randomBytes, createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generates a cryptographically random token and its SHA-256 hash.
 */
function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(token).digest('hex')
  return { token, hash }
}

// ---------------------------------------------------------------------------
// Shared types — kept minimal so callers only pass what's needed.
// ---------------------------------------------------------------------------

export interface AuthDb {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insert: (table: any) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (table: any) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select: () => any
}

/**
 * Initiates a password reset for the given email.
 *
 * @param email     - The user's email address.
 * @param db        - The Drizzle DB instance (from @repo/models/db).
 * @param tables    - The Drizzle table objects: { profiles, authTokens }.
 * @param operators - Drizzle query operators: { eq }.
 * @param sendEmail - A callback to send the reset email (Team 08 provides this).
 */
export async function requestPasswordReset(
  email: string,
  db: AuthDb,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tables: { profiles: any; authTokens: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operators: { eq: any },
  sendEmail?: (email: string, token: string) => Promise<void>,
): Promise<void> {
  const { profiles, authTokens } = tables
  const { eq } = operators

  // 1. Find user by email
  const [userRecord] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email.toLowerCase()))
    .limit(1)

  // Security rule: silently return if user not found — prevents email enumeration
  if (!userRecord) return

  // 2. Generate token and hash
  const { token, hash } = generateToken()

  // 3. Store hash in DB with 1 hour expiry
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await db.insert(authTokens).values({
    userId: userRecord.id,
    type: 'PASSWORD_RESET',
    tokenHash: hash,
    expiresAt,
  })

  // 4. Send the reset email (Team 08 integration, mocked until they ship it)
  if (sendEmail) {
    await sendEmail(userRecord.email as string, token)
  } else {
    console.log(`[MOCK EMAIL] Reset token for ${email}: ${token}`)
  }
}

/**
 * Confirms a password reset using the token from the email.
 * Verifies the token, updates the password in Supabase, and revokes all sessions.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  db: AuthDb,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tables: { authTokens: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operators: { eq: any; and: any },
  supabase: SupabaseClient,
): Promise<void> {
  const { authTokens } = tables
  const { eq, and } = operators
  const tokenHash = createHash('sha256').update(token).digest('hex')

  // 1. Find the token in the DB
  const [tokenRecord] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.tokenHash, tokenHash), eq(authTokens.type, 'PASSWORD_RESET')))
    .limit(1)

  if (!tokenRecord) {
    throw new Error('Invalid or expired reset token')
  }

  // 2. Check expiry
  if (new Date() > tokenRecord.expiresAt) {
    await db.delete(authTokens).where(eq(authTokens.id, tokenRecord.id))
    throw new Error('Invalid or expired reset token')
  }

  // 3. Update password in Supabase Auth
  const { error } = await supabase.auth.admin.updateUserById(tokenRecord.userId as string, {
    password: newPassword,
  })

  if (error) throw new Error('Failed to update password')

  // 4. Delete the used reset token (single-use rule)
  await db.delete(authTokens).where(eq(authTokens.id, tokenRecord.id))

  // 5. Revoke all sessions for the user
  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, tokenRecord.userId), eq(authTokens.type, 'REFRESH')))
}

/**
 * Changes the password for an already authenticated user.
 * Verifies the old password by attempting a Supabase sign-in.
 */
export async function changePassword(
  userId: string,
  email: string,
  oldPassword: string,
  newPassword: string,
  db: AuthDb,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tables: { authTokens: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operators: { eq: any; and: any },
  supabase: SupabaseClient,
): Promise<void> {
  const { authTokens } = tables
  const { eq, and } = operators

  // 1. Verify old password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: oldPassword,
  })

  if (signInError) throw new Error('Invalid old password')

  // 2. Update password in Supabase Auth
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (updateError) throw new Error('Failed to update password')

  // 3. Revoke all other sessions
  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, 'REFRESH')))
}
