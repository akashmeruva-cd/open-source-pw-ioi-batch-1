import { resolve } from 'node:path'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: resolve(__dirname, './src/schema.ts'),
  out: resolve(__dirname, '../../supabase/migrations'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
})
