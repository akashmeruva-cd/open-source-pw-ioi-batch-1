import type { Router } from 'express'
import authModule from './modules/auth/auth.module'
import subjectsModule from './modules/subjects/subjects.module'

export interface ApiModule {
  basePath: string
  router: Router
}

/**
 * APPEND-ONLY REGISTRY.
 *
 * Adding a feature = adding your module's import above and one line below, in
 * alphabetical order. Because every team touches a different line, git merges
 * these automatically instead of conflicting.
 *
 * Do not reorder, do not group, do not reformat other teams' lines.
 */
export const modules: ApiModule[] = [
  authModule,
  // announcementsModule,   → Team 08
  // assignmentsModule,     → Team 05
  // assistantModule,       → Team 13
  // attendanceModule,      → Team 06
  // materialsModule,       → Team 04
  // sessionsModule,        → Team 07
  subjectsModule,
]
