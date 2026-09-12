import type { Request, Response } from 'express'
import { changeRoleService, deactivateUserService, activateUserService } from './users.service'
import { AuditLog } from '@repo/models/audit-log'

/** Change a user's role. ADMIN only. Target user cannot be self. */
export async function changeRole(req: Request, res: Response) {
  const actorId = (req.auth as any).sub
  const targetId = req.params.id
  const { role } = req.body as { role: string }

  if (targetId === actorId) {
    throw new Error('Cannot change own role')
  }

  await changeRoleService(targetId, role, actorId)

  res.json({ message: 'Role updated', role })
}

/** Deactivate a user. ADMIN only. Target user cannot be self. */
export async function deactivateUser(req: Request, res: Response) {
  const actorId = (req.auth as any).sub
  const targetId = req.params.id

  if (targetId === actorId) {
    throw new Error('Cannot deactivate own account')
  }

  await deactivateUserService(targetId, actorId)

  res.json({ message: 'User deactivated' })
}

/** Reactivate a user. ADMIN only. */
export async function activateUser(req: Request, res: Response) {
  const actorId = (req.auth as any).sub
  const targetId = req.params.id

  await activateUserService(targetId, actorId)

  res.json({ message: 'User reactivated' })
}