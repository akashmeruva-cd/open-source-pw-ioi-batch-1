import { updateProfile } from '@repo/models/db'
import { profiles } from '@repo/models/schema'
import { eq } from 'drizzle-orm'
import { AuditLog } from '@repo/models/audit-log'
import { revokeAllSessionsForUser } from '@repo/auth/session'

export async function changeRoleService(targetId: string, newRole: string, actorId: string) {
  await updateProfile(targetId, { role: newRole })

  await AuditLog.create({
    actorId,
    action: 'role_change',
    entity: 'profiles',
    entityId: targetId,
    meta: { newRole, targetId },
  })
}

export async function deactivateUserService(targetId: string, actorId: string) {
  await updateProfile(targetId, { isActive: false })

  await revokeAllSessionsForUser(targetId)

  await AuditLog.create({
    actorId,
    action: 'deactivate',
    entity: 'profiles',
    entityId: targetId,
    meta: { targetId },
  })
}

export async function activateUserService(targetId: string, actorId: string) {
  await updateProfile(targetId, { isActive: true })

  await AuditLog.create({
    actorId,
    action: 'activate',
    entity: 'profiles',
    entityId: targetId,
    meta: { targetId },
  })
}