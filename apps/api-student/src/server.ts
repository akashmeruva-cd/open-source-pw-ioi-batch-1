import { resolve } from 'node:path'
import { config } from 'dotenv'

/**
 * Local development entry point. On Vercel, `api/index.ts` is used instead and
 * environment variables come from the platform — which is why this file, not
 * `app.ts`, is where `.env` gets loaded.
 *
 * The `.env` lives at the repo root so all four apps share one file. dotenv
 * never overwrites a variable that is already set, so a real environment always
 * wins over the file.
 */
config({ path: resolve(__dirname, '../../../.env') })

// Imported after the env is loaded — `app.ts` reads CORS_ORIGIN at startup.
// eslint-disable-next-line import/first
import { createApp } from './app'

const port = Number(process.env.PORT ?? 4000)

createApp().listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[api-student] API running on http://localhost:${port} -> Open Student Portal at http://localhost:3000`,
  )
})
