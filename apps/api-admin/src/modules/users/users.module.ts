import type { ApiModule } from '../../modules'
import { usersRouter } from './users.routes'

const usersModule: ApiModule = {
  basePath: '/api/users',
  router: usersRouter,
}

export default usersModule
