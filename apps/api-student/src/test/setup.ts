import { afterAll, beforeAll } from 'vitest'
import { disconnectFromDatabase } from '@repo/models/db'

/**
 * LOCKED FILE — Team 01 (Core Platform).
 *
 * Test setup for api-student.
 */

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
  process.env.SUPABASE_JWT_SECRET =
    process.env.SUPABASE_JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long'
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
})

afterAll(async () => {
  await disconnectFromDatabase()
})
