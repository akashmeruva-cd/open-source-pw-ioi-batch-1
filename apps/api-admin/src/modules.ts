import type { Router } from 'express'
import authModule from './modules/auth/auth.module'
import usersModule from './modules/users/users.module'

export interface ApiModule {
  basePath: string
  router: Router
  /**
   * Mount outside the admin role gate. Only `auth` should ever set this — if you
   * find yourself reaching for it, you are about to expose admin data.
   */
  public?: boolean
}

/**
 * APPEND-ONLY REGISTRY.
 *
 * Adding a feature = adding your module's import above and one line below, in
 * alphabetical order. Because every team touches a different line, git merges
 * these automatically instead of conflicting.
 */
export const modules: ApiModule[] = [
  authModule,
  // analyticsModule,     → Team 12
  // announcementsModule, → Team 08
  // assignmentsModule,   → Team 05
  // attendanceModule,    → Team 06
  // batchesModule,       → Team 10
  // materialsModule,     → Team 04
  // sessionsModule,      → Team 07
  usersModule,
]
