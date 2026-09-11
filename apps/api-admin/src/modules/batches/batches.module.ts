import type { ApiModule } from '../../modules'
import { Router } from 'express'
import { batchesRouter } from './batches.route'
import { subjectsRouter } from './subjects.route'
import { enrollmentsRouter } from './enrollments.route'
import { studentsRouter } from './students.route'

const router = Router()

router.use('/batches', batchesRouter)
router.use('/subjects', subjectsRouter)
router.use('/enrollments', enrollmentsRouter)
router.use('/students', studentsRouter)

const batchesModule: ApiModule = {
  basePath: '/api',
  router,
}

export default batchesModule
