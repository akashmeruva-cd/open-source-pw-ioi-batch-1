import { resolve } from 'node:path'
import { config } from 'dotenv'

/**
 * Local development entry point. On Vercel, `api/index.ts` is used instead and
 * environment variables come from the platform — which is why this file, not
 * `app.ts`, is where `.env` gets loaded.
 */
config({ path: resolve(__dirname, '../../../.env') })

// eslint-disable-next-line import/first
import { createApp } from './app'

const port = Number(process.env.PORT ?? 4001)

createApp().listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[api-admin] API running on http://localhost:${port} -> Open Admin Portal at http://localhost:3001`,
  )
})
