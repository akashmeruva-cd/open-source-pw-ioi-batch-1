import type { ApiModule } from '../../modules'
import { analyticsRouter } from './analytics.routes'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Mounted at /api/analytics, behind the admin role gate (public is NOT set).
 * Only ADMIN and FACULTY tokens can reach these endpoints.
 */
const analyticsModule: ApiModule = {
  basePath: '/api/analytics',
  router: analyticsRouter,
}

export default analyticsModule
