import type { ApiModule } from '../../modules'
import { materialsRouter } from './materials.routes'

const materialsModule: ApiModule = {
  basePath: '/api/materials',
  router: materialsRouter,
}

export default materialsModule
