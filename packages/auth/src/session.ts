import { getSupabaseAdmin } from '@repo/models/db'

/** Revoke all active sessions for a given user. */
export async function revokeAllSessionsForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { session_revoked: true }
  })
}