import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createErrorHandler, notFoundHandler } from '@repo/http/error-middleware'
import { getDb } from '@repo/models/db'
import { createLocalUploadRouter } from '@repo/services/storage-local'
import { modules } from './modules'

/**
 * LOCKED FILE — Team 01 (Core Platform).
 *
 * You should never need to edit this to add a feature. Register your module in
 * `src/modules.ts` instead — one line, alphabetical. That is deliberate: with 13
 * teams shipping at once, a file everybody edits is a file everybody conflicts in.
 */
export function createApp() {
  const app = express()

  // Vercel terminates TLS upstream; without this, rate limiting sees one IP.
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map((o) => o.trim()),
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  // Eagerly initialise the Drizzle connection on the first request. This is
  // cheap on warm serverless invocations because the connection is cached.
  app.use((_req, _res, next) => {
    try {
      getDb()
      next()
    } catch (err) {
      next(err)
    }
  })

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'api-student', time: new Date().toISOString() })
  })

  // Local file storage only. On Vercel STORAGE_DRIVER=supabase, so this is
  // never mounted there — serverless filesystems are ephemeral and per-instance.
  if ((process.env.STORAGE_DRIVER || 'local') === 'local') {
    app.use('/api/uploads', createLocalUploadRouter())
  }

  for (const mod of modules) {
    app.use(mod.basePath, mod.router)
  }

  app.use(notFoundHandler)
  app.use(createErrorHandler('api-student'))

  return app
}
