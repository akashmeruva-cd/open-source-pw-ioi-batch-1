import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { requireAuth, requireRole } from '@repo/auth/middleware'
import { createErrorHandler, notFoundHandler } from '@repo/http/error-middleware'
import { getDb } from '@repo/models/db'
import { createLocalUploadRouter } from '@repo/services/storage-local'
import { ADMIN_PORTAL_ROLES } from '@repo/validation/enums'
import { modules } from './modules'

/**
 * LOCKED FILE — Team 01 (Core Platform) + a maintainer review.
 *
 * The important line in this file is the role gate below. Every module except
 * `auth` is mounted *behind* `requireAuth` + `requireRole(ADMIN, FACULTY)`, so a
 * student token cannot reach admin functionality even if a team forgets to guard
 * its own routes. This is the single reason `api-admin` exists as a separate
 * service — do not weaken it.
 */
export function createApp() {
  const app = express()

  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3001').split(',').map((o) => o.trim()),
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.use((_req, _res, next) => {
    try {
      getDb()
      next()
    } catch (err) {
      next(err)
    }
  })

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'api-admin', time: new Date().toISOString() })
  })

  // Local file storage only — see the note in `api-student/src/app.ts`.
  if ((process.env.STORAGE_DRIVER || 'local') === 'local') {
    app.use('/api/uploads', requireAuth, createLocalUploadRouter())
  }

  // Behind the gate on purpose: the admin frontend calls this to confirm the
  // session is still valid *and* still privileged, and `app.test.ts` uses it to
  // prove the gate rejects student tokens.
  app.get('/api/whoami', requireAuth, requireRole(...ADMIN_PORTAL_ROLES), (req, res) => {
    res.json({ sub: req.auth?.sub, role: req.auth?.role })
  })

  for (const mod of modules) {
    if (mod.public) {
      app.use(mod.basePath, mod.router)
    } else {
      app.use(mod.basePath, requireAuth, requireRole(...ADMIN_PORTAL_ROLES), mod.router)
    }
  }

  app.use(notFoundHandler)
  app.use(createErrorHandler('api-admin'))

  return app
}
