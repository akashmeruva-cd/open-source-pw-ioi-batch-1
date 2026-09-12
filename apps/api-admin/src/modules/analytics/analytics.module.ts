import type { ApiModule } from '../../modules'
import { analyticsRouter } from './analytics.routes'

/** Owner: Team 12 — Admin Analytics & Reports. */
const analyticsModule: ApiModule = {
  basePath: '/api/analytics',
  router: analyticsRouter,
}

export default analyticsModule