import type { ApiModule } from '../../modules'
import { subjectsRouter } from './subjects.route'

const subjectsModule: ApiModule = {
  basePath: '/api/subjects',
  router: subjectsRouter,
}

export default subjectsModule
