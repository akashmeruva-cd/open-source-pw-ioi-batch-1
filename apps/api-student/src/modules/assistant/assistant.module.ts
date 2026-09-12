import type { ApiModule } from '../../modules'
import { assistantRouter } from './assistant.routes'

/** Owner: Team 13 — AI Assistant. */
const assistantModule: ApiModule = {
  basePath: '/api/assistant',
  router: assistantRouter,
}

export default assistantModule
