import type { ApiModule } from '../../modules'
import { materialsRouter } from './materials.routes'

/** Owner: Team 04 — Class Materials. */

const materialsModule: ApiModule = {
  basePath: '/api/materials',
  router: materialsRouter,
}

export default materialsModule
