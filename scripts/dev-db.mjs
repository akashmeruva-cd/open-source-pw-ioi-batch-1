import { execSync, spawn } from 'node:child_process'

/**
 * Local Supabase runner — `npm run db:local`.
 *
 * Runs `npx supabase start` to launch local PostgreSQL, Auth, and Studio.
 * Requires Docker Desktop running on the machine.
 */

console.log('Starting local Supabase stack (PostgreSQL + Auth + Studio)...')

try {
  const child = spawn('npx', ['supabase', 'start'], { stdio: 'inherit' })

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(
        '\n❌ Failed to start Supabase. Make sure Docker Desktop is installed and running.\n',
      )
      process.exit(code ?? 1)
    }
  })

  const stop = () => {
    console.log('\nStopping Supabase...')
    try {
      execSync('npx supabase stop', { stdio: 'inherit' })
    } catch {
      // ignore
    }
    process.exit(0)
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
} catch (err) {
  console.error('Error starting Supabase:', err)
  process.exit(1)
}
