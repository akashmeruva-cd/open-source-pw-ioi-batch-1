import { Router } from 'express'
import { requireAuth } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { assistantChatSchema } from '@repo/validation/assistant'
import * as controller from './assistant.controller'

/** Owner: Team 13 — AI Assistant. */
export const assistantRouter: Router = Router()

assistantRouter.post(
  '/chat',
  requireAuth,
  validate(assistantChatSchema),
  asyncHandler(controller.chat),
)
