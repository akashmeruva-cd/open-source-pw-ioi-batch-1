import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { requireAuth } from '@repo/auth/middleware'
import * as controller from './subjects.controller'

export const subjectsRouter = Router()

// Since the whole app except auth is behind requireAuth globally, we might not strictly need it here, but it's safe.
subjectsRouter.get('/me', requireAuth, asyncHandler(controller.getMySubjects))
